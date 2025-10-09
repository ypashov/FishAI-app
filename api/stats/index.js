'use strict'

const { BlobServiceClient } = require('@azure/storage-blob')

module.exports = async function (context, req) {
  context.log('stats: incoming request')

  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'uploads'

    if (!connectionString) {
      throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING configuration value.')
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const containerClient = blobServiceClient.getContainerClient(containerName)

    let exists = true
    try {
      await containerClient.getProperties()
    } catch (err) {
      if (err.statusCode === 404) {
        exists = false
      } else {
        throw err
      }
    }

    let total = 0
    if (exists) {
      for await (const _ of containerClient.listBlobsFlat({ includeMetadata: false })) {
        total += 1
      }
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        totalRecognitions: total,
        container: containerName,
        computedAt: new Date().toISOString()
      }
    }
  } catch (error) {
    context.log.error('stats: failed to compute total recognitions', error)
    context.res = {
      status: 500,
      body: { error: error.message || 'Unable to compute recognition stats.' }
    }
  }
}
