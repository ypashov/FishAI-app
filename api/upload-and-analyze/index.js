'use strict'

const { BlobServiceClient } = require('@azure/storage-blob')
const crypto = require('node:crypto')
const { createReadSasUrl } = require('../_shared/sas')
const { ensureAuthorized, UnauthorizedError } = require('../_shared/security')

// Handles direct uploads, stores metadata, and captures Vision insights.
// Restrict uploads to known-safe image MIME types.
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif'
])
const DEFAULT_MAX_BYTES = 6 * 1024 * 1024 // 6 MB
const MAX_IMAGE_SIZE_BYTES = Number(process.env.MAX_IMAGE_SIZE_BYTES || DEFAULT_MAX_BYTES)

module.exports = async function (context, req) {
  context.log('upload-and-analyze: request received')

  try {
    // Optional shared-secret enforcement.
    ensureAuthorized(req)

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'uploads'
    const metadataContainerName = process.env.AZURE_METADATA_CONTAINER || 'analysis-metadata'
    const visionEndpoint = (process.env.AZURE_VISION_ENDPOINT || '').trim()
    const visionKey = (process.env.AZURE_VISION_KEY || '').trim()

    if (!connectionString) {
      throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING configuration value.')
    }
    if (!visionEndpoint || !visionKey) {
      throw new Error('Missing Azure Vision configuration. Set AZURE_VISION_ENDPOINT and AZURE_VISION_KEY.')
    }

    const {
      fileName = 'upload.jpg',
      contentType: providedContentType = 'application/octet-stream',
      data
    } = req.body || {}

    if (!data || typeof data !== 'string') {
      context.log.warn('upload-and-analyze: invalid payload received')
      context.res = {
        status: 400,
        body: { error: 'Request body must include a base64 encoded image in the `data` field.' }
      }
      return
    }

    const normalizedContentType = (providedContentType || '').toLowerCase()
    if (!ALLOWED_CONTENT_TYPES.has(normalizedContentType)) {
      context.log.warn(`upload-and-analyze: rejected contentType ${normalizedContentType}`)
      context.res = {
        status: 400,
        body: { error: 'Unsupported image content type.' }
      }
      return
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const blobName = `${crypto.randomUUID()}-${sanitizedFileName}`

    // Strip base64 prefix if present (e.g. data URLs).
    const base64Payload = data.includes(',') ? data.split(',').pop() : data
    let buffer
    try {
      buffer = Buffer.from(base64Payload, 'base64')
    } catch (err) {
      context.log.error('upload-and-analyze: failed parsing base64 payload', err)
      context.res = {
        status: 400,
        body: { error: 'Unable to decode image payload. Ensure the data is base64 encoded.' }
      }
      return
    }

    if (!buffer.length || buffer.length > MAX_IMAGE_SIZE_BYTES) {
      context.log.warn(
        `upload-and-analyze: payload rejected due to size (${buffer.length} bytes, limit ${MAX_IMAGE_SIZE_BYTES})`
      )
      context.res = {
        status: 400,
        body: {
          error: `Image exceeds maximum size of ${Math.round(MAX_IMAGE_SIZE_BYTES / (1024 * 1024))} MB or is empty.`
        }
      }
      return
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const metadataContainerClient = blobServiceClient.getContainerClient(metadataContainerName)
    await Promise.all([containerClient.createIfNotExists(), metadataContainerClient.createIfNotExists()])

    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: normalizedContentType }
    })

    const sasUrl = createReadSasUrl({
      blobClient: blockBlobClient,
      credential: blobServiceClient.credential
    })

    const endpoint = visionEndpoint.replace(/\/+$/, '')
    const analyzeUrl = `${endpoint}/vision/v3.2/analyze?visualFeatures=Description,Tags,Objects`

    // Forward the original binary buffer directly to Vision for best fidelity.
    const visionResponse = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': visionKey,
        'Content-Type': normalizedContentType
      },
      body: buffer
    })

    const responseText = await visionResponse.text()
    let analysis
    try {
      analysis = responseText ? JSON.parse(responseText) : {}
    } catch (err) {
      context.log.warn('upload-and-analyze: Azure Vision returned non-JSON payload')
      analysis = { raw: responseText }
    }

    if (!visionResponse.ok) {
      const visionError = analysis?.error?.message || analysis?.message || responseText
      throw new Error(`Azure Vision error (${visionResponse.status}): ${visionError}`)
    }

    const caption = analysis?.description?.captions?.[0] || null
    const objects = (analysis?.objects || []).map((obj) => ({
      name: obj.object,
      confidence: obj.confidence
    }))
    const tags = (analysis?.tags || []).map((tag) => ({
      name: tag.name,
      confidence: tag.confidence
    }))

    const analyzedAt = new Date().toISOString()

    const metadataRecord = {
      id: crypto.randomUUID(),
      blobName,
      container: containerName,
      contentType: normalizedContentType,
      fileName,
      caption: caption?.text || null,
      captionConfidence: caption?.confidence || null,
      tags,
      objects,
      analyzedAt
    }

    const metadataBlob = metadataContainerClient.getBlockBlobClient(`${blobName}.json`)
    const metadataJson = JSON.stringify(metadataRecord)
    await metadataBlob.upload(Buffer.from(metadataJson), Buffer.byteLength(metadataJson), {
      blobHTTPHeaders: { blobContentType: 'application/json' }
    })

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        id: metadataRecord.id,
        blobName,
        blobUrl: blockBlobClient.url,
        sasUrl,
        description: caption
          ? `${caption.text} (${Math.round(caption.confidence * 100)}% confidence)`
          : 'No description available.',
        tags,
        objects,
        analyzedAt
      }
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      context.res = {
        status: error.statusCode,
        body: { error: error.message }
      }
      return
    }

    context.log.error('upload-and-analyze: unexpected error', error)
    context.res = {
      status: 500,
      body: { error: error.message || 'Unexpected server error.' }
    }
  }
}
