'use strict'

const { BlobServiceClient, BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob')

module.exports = async function (context, req) {
  const limit = Math.max(1, Math.min(parseInt(req.query.limit, 10) || 5, 25))

  try {
    const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING
    const containerName = process.env.AZURE_STORAGE_CONTAINER || 'uploads'
    const metadataContainerName = process.env.AZURE_METADATA_CONTAINER || 'analysis-metadata'

    if (!connectionString) {
      throw new Error('Missing AZURE_STORAGE_CONNECTION_STRING configuration value.')
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
    const metadataContainerClient = blobServiceClient.getContainerClient(metadataContainerName)

    const credential = blobServiceClient.credential
    if (!credential) {
      throw new Error('Storage credential not available. Ensure you are using a shared key connection string.')
    }

    const entries = []
    for await (const blob of metadataContainerClient.listBlobsFlat({ includeMetadata: false })) {
      entries.push(blob)
    }

    if (!entries.length) {
      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: { items: [] }
      }
      return
    }

    entries.sort((a, b) => new Date(b.properties.lastModified) - new Date(a.properties.lastModified))
    const selected = entries.slice(0, limit)
    const containerClient = blobServiceClient.getContainerClient(containerName)

    const results = []
    for (const blob of selected) {
      const metadataBlobClient = metadataContainerClient.getBlobClient(blob.name)
      const download = await metadataBlobClient.download()
      const body = await streamToBuffer(download.readableStreamBody)
      const record = JSON.parse(body.toString('utf8'))

      const imageBlobName = record.blobName
      const imageBlobClient = containerClient.getBlobClient(imageBlobName)

      const sasToken = generateBlobSASQueryParameters(
        {
          containerName,
          blobName: imageBlobName,
          permissions: BlobSASPermissions.parse('r'),
          startsOn: new Date(Date.now() - 5 * 60 * 1000),
          expiresOn: new Date(Date.now() + 60 * 60 * 1000),
          protocol: 'https'
        },
        credential
      ).toString()

      results.push({
        id: record.id || imageBlobName,
        analyzedAt: record.analyzedAt,
        blobName: imageBlobName,
        fileName: record.fileName,
        objects: record.objects || [],
        description: record.description || null,
        captionConfidence: record.captionConfidence || null,
        sasUrl: `${imageBlobClient.url}?${sasToken}`
      })
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { items: results }
    }
  } catch (error) {
    context.log.error('recent: failed to load recent analyses', error)
    context.res = {
      status: 500,
      body: { error: error.message || 'Unable to load recent analyses.' }
    }
  }
}

async function streamToBuffer(readableStream) {
  if (!readableStream) return Buffer.alloc(0)
  const chunks = []
  for await (const chunk of readableStream) {
    chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}
