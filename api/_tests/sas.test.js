import { describe, expect, it, vi } from 'vitest'

vi.mock('@azure/storage-blob', () => {
  return {
    BlobSASPermissions: {
      parse: vi.fn(() => ({ parsed: true }))
    },
    generateBlobSASQueryParameters: vi.fn(() => ({
      toString: () => 'signed-token'
    }))
  }
})

const azure = await import('@azure/storage-blob')
const { createReadSasUrl } = await import('../_shared/sas.js')

describe('createReadSasUrl', () => {
  it('throws when credential is missing', () => {
    const blobClient = { containerName: 'c', name: 'blob', url: 'https://example.com/blob' }
    expect(() => createReadSasUrl({ blobClient, credential: null })).toThrow('Storage credential not available')
  })

  it('generates a signed URL when credential is present', () => {
    const blobClient = { containerName: 'c', name: 'blob', url: 'https://example.com/blob' }
    const credential = {}

    const signedUrl = createReadSasUrl({ blobClient, credential, expiresInMinutes: 10 })
    expect(signedUrl).toBe('https://example.com/blob?signed-token')
    expect(azure.BlobSASPermissions.parse).toHaveBeenCalledWith('r')
    expect(azure.generateBlobSASQueryParameters).toHaveBeenCalled()
  })
})
