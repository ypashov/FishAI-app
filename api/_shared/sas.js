'use strict'

const { BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob')

function createReadSasUrl({ blobClient, credential, expiresInMinutes = 60 }) {
  if (!credential) {
    throw new Error('Storage credential not available. Ensure a shared key connection string is used.')
  }

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName: blobClient.containerName,
      blobName: blobClient.name,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(Date.now() - 5 * 60 * 1000),
      expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      protocol: 'https'
    },
    credential
  ).toString()

  return `${blobClient.url}?${sasToken}`
}

module.exports = {
  createReadSasUrl
}
