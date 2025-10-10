'use strict'

const { BlobServiceClient } = require('@azure/storage-blob')
const { ensureAuthorized, UnauthorizedError } = require('../_shared/security')

// Lightweight counter endpoint that reports how many analyses have been recorded.

module.exports = async function (context, req) {
  context.log('stats: incoming request')

  try {
    ensureAuthorized(req)

    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'uploads'
    const metadataContainerName = process.env.AZURE_METADATA_CONTAINER || 'analysis-metadata'

    if (!connectionString) {
      throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING configuration value.')
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(metadataContainerName)

    // Count metadata blobs instead of raw images so thumbnails and uploads stay in sync.
    let total = 0
    try {
      await containerClient.getProperties()
      for await (const _ of containerClient.listBlobsFlat({ includeMetadata: false })) {
        total += 1
      }
    } catch (err) {
      if (err.statusCode !== 404) {
        throw err
      }
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        totalRecognitions: total,
        container: metadataContainerName,
        computedAt: new Date().toISOString()
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

    context.log.error('stats: failed to compute total recognitions', error)
    context.res = {
      status: 500,
      body: { error: error.message || 'Unable to compute recognition stats.' }
    }
  }
}
