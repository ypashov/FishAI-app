'use strict'

const { describe, it, expect } = require('vitest')
const { StorageSharedKeyCredential } = require('@azure/storage-blob')
const { createReadSasUrl } = require('../_shared/sas')

describe('createReadSasUrl', () => {
  it('throws when credential is missing', () => {
    const blobClient = { containerName: 'c', name: 'blob', url: 'https://example.com/blob' }
    expect(() => createReadSasUrl({ blobClient, credential: null })).toThrow('Storage credential not available')
  })

  it('generates a signed URL when credential is present', () => {
    const blobClient = { containerName: 'c', name: 'blob', url: 'https://example.com/blob' }
    const credential = new StorageSharedKeyCredential('account', 'C2FhYWEwMTIzNDU2Nzg5MDEyMzQ1Njc4OTA=')

    const signedUrl = createReadSasUrl({ blobClient, credential, expiresInMinutes: 10 })
    expect(signedUrl).toContain(blobClient.url)
    expect(signedUrl).toContain('sig=')
  })
})
