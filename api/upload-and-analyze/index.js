'use strict'

const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob')
const crypto = require('node:crypto')

module.exports = async function (context, req) {
  context.log('upload-and-analyze: request received')

  try {
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

    const { fileName = 'upload.jpg', contentType = 'application/octet-stream', data } = req.body || {}

    if (!data || typeof data !== 'string') {
      context.log.warn('upload-and-analyze: invalid payload received')
      context.res = {
        status: 400,
        body: { error: 'Request body must include a base64 encoded image in the `data` field.' }
      }
      return
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const blobName = `${crypto.randomUUID()}-${sanitizedFileName}`

    const base64 = data.includes(',') ? data.split(',').pop() : data
    let buffer
    try {
      buffer = Buffer.from(base64, 'base64')
    } catch (err) {
      context.log.error('upload-and-analyze: failed parsing base64 payload', err)
      context.res = {
        status: 400,
        body: { error: 'Unable to decode image payload. Ensure the data is base64 encoded.' }
      }
      return
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const metadataContainerClient = blobServiceClient.getContainerClient(metadataContainerName)
    await Promise.all([containerClient.createIfNotExists(), metadataContainerClient.createIfNotExists()])

    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    await blockBlobClient.upload(buffer, buffer.length, {
      blobHTTPHeaders: { blobContentType: contentType }
    })

    const credential = blobServiceClient.credential
    if (!credential) {
      throw new Error('Storage credential not available. Ensure you are using a shared key connection string.')
    }

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        startsOn: new Date(Date.now() - 5 * 60 * 1000),
        expiresOn: new Date(Date.now() + 60 * 60 * 1000),
        protocol: 'https'
      },
      credential
    ).toString()

    const sasUrl = `${blockBlobClient.url}?${sasToken}`

    const endpoint = visionEndpoint.replace(/\/+$/, '')
    const analyzeUrl = `${endpoint}/vision/v3.2/analyze?visualFeatures=Description,Tags,Objects`

    const visionResponse = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': visionKey,
        'Content-Type': contentType || 'application/octet-stream'
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
      blobUrl: blockBlobClient.url,
      container: containerName,
      contentType,
      fileName,
      description: caption?.text || null,
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
        rawAnalysis: analysis,
        analyzedAt
      }
    }
  } catch (error) {
    context.log.error('upload-and-analyze: unexpected error', error)
    context.res = {
      status: 500,
      body: { error: error.message || 'Unexpected server error.' }
    }
  }
}
