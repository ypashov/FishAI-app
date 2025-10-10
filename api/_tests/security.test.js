import { describe, expect, it } from 'vitest'

import securityModule from '../_shared/security.js'

const { ensureAuthorized, UnauthorizedError } = securityModule

describe('ensureAuthorized (API key enforcement)', () => {
  it('allows request when API_KEY is unset', () => {
    const original = process.env.API_KEY
    delete process.env.API_KEY

    expect(() => ensureAuthorized({ headers: {} })).not.toThrow()

    if (original) process.env.API_KEY = original
  })

  it('throws UnauthorizedError when API key missing', () => {
    process.env.API_KEY = 'secret'
    expect(() => ensureAuthorized({ headers: {} })).toThrow(UnauthorizedError)
  })

  it('accepts valid header key', () => {
    process.env.API_KEY = 'secret'
    expect(() =>
      ensureAuthorized({ headers: { 'x-api-key': 'secret' } })
    ).not.toThrow()
  })
})
