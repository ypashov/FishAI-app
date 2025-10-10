'use strict'

const { BlobSASPermissions, generateBlobSASQueryParameters } = require('@azure/storage-blob')

// Generates a short-lived read SAS URL for a given blob client.
function createReadSasUrl ({ blobClient, credential, expiresInMinutes = 60 }, azureLib = { BlobSASPermissions, generateBlobSASQueryParameters }) {
  if (!credential) {
    throw new Error('Storage credential not available. Ensure a shared key connection string is used.')
  }

  const sasToken = azureLib.generateBlobSASQueryParameters(
    {
      containerName: blobClient.containerName,
      blobName: blobClient.name,
      permissions: azureLib.BlobSASPermissions.parse('r'),
      startsOn: new Date(Date.now() - 5 * 60 * 1000),
      expiresOn: new Date(Date.now() + expiresInMinutes * 60 * 1000),
      protocol: 'https'
    },
    credential
  ).toString()

  return `${blobClient.url}?${sasToken}`
}

module.exports = {
  // Single entry-point for SAS generation to keep permissions consistent.
  createReadSasUrl
}
