'use strict'

const { BlobServiceClient } = require('@azure/storage-blob')
const { createReadSasUrl } = require('../_shared/sas')
const { ensureAuthorized, UnauthorizedError } = require('../_shared/security')

// Cache the recent list server-side to reduce storage churn under load.
const CACHE_TTL_MS = Number(process.env.RECENT_CACHE_TTL_MS || 60_000) // default 60 seconds
const MAX_LIMIT = 50
const MIN_LIMIT = 1

let cachedResults = {
  items: [],
  expiresAt: 0,
  pageSize: 0
}

module.exports = async function (context, req) {
  const limit = Math.max(MIN_LIMIT, Math.min(parseInt(req.query.limit, 10) || 5, MAX_LIMIT))

  try {
    ensureAuthorized(req)

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'uploads'
    const metadataContainerName = process.env.AZURE_METADATA_CONTAINER || 'analysis-metadata'

    if (!connectionString) {
      throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING configuration value.')
    }

    const now = Date.now()
    if (now < cachedResults.expiresAt && cachedResults.pageSize >= limit) {
      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { items: cachedResults.items.slice(0, limit) }
      }
      return
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const metadataContainerClient = blobServiceClient.getContainerClient(metadataContainerName)
    const containerClient = blobServiceClient.getContainerClient(containerName)

    // Fetch slightly more than requested in case some records lack data.
    const blobs = await listLatestMetadataBlobs(metadataContainerClient, limit * 2)
    if (!blobs.length) {
      cachedResults = { items: [], expiresAt: now + CACHE_TTL_MS, pageSize: 0 }
      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { items: [] }
      }
      return
    }

    const items = []
    for (const blob of blobs) {
      const metadataBlobClient = metadataContainerClient.getBlobClient(blob.name)
      const download = await metadataBlobClient.download()
      const body = await streamToBuffer(download.readableStreamBody)
      const record = JSON.parse(body.toString('utf8'))

      const imageBlobName = record.blobName
      const imageBlobClient = containerClient.getBlobClient(imageBlobName)

      const sasUrl = createReadSasUrl({
        blobClient: imageBlobClient,
        credential: blobServiceClient.credential
      })

      items.push({
        id: record.id || imageBlobName,
        analyzedAt: record.analyzedAt,
        blobName: imageBlobName,
        fileName: record.fileName,
        objects: record.objects || [],
        caption: record.caption || null,
        captionConfidence: record.captionConfidence || null,
        sasUrl
      })

      if (items.length === limit) {
        break
      }
    }

    cachedResults = {
      items,
      expiresAt: now + CACHE_TTL_MS,
      pageSize: items.length
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { items }
    }
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      context.res = {
        status: error.statusCode,
        body: { error: error.message }
      }
      return
    }

    context.log.error('recent: failed to load recent analyses', error)
    context.res = {
      status: 500,
      body: { error: error.message || 'Unable to load recent analyses.' }
    }
  }
}

// Helper: pull down the latest metadata blobs (sorted by last modified) up to the desired count.
async function listLatestMetadataBlobs (metadataContainerClient, desired) {
  const results = []
  const pageSize = Math.max(desired, 10)
  const iterator = metadataContainerClient.listBlobsFlat({ includeMetadata: false }).byPage({
    maxPageSize: pageSize
  })

  const firstPage = await iterator.next()
  if (firstPage.done || !firstPage.value.segment) {
    return results
  }

  const blobs = firstPage.value.segment.blobItems || []
  blobs.sort((a, b) => new Date(b.properties.lastModified) - new Date(a.properties.lastModified))

  for (const blob of blobs) {
    results.push(blob)
    if (results.length >= desired) break
  }

  return results
}

async function streamToBuffer (readableStream) {
  if (!readableStream) return Buffer.alloc(0)
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
