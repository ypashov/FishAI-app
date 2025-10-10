import { describe, expect, it } from 'vitest'

const { createReadSasUrl } = await import('../_shared/sas.js')

describe('createReadSasUrl', () => {
  it('throws when credential is missing', () => {
    const blobClient = { containerName: 'c', name: 'blob', url: 'https://example.com/blob' }
    expect(() => createReadSasUrl({ blobClient, credential: null })).toThrow('Storage credential not available')
  })

  it('generates a signed URL when credential is present', () => {
    const blobClient = { containerName: 'c', name: 'blob', url: 'https://example.com/blob' }
    const credential = {}
    const azureStub = {
      BlobSASPermissions: { parse: () => ({}) },
      generateBlobSASQueryParameters: () => ({ toString: () => 'signed-token' })
    }

    const signedUrl = createReadSasUrl({ blobClient, credential, expiresInMinutes: 10 }, azureStub)
    expect(signedUrl).toBe('https://example.com/blob?signed-token')
  })
})
