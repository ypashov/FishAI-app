'use strict'

const { describe, it, expect } = require('vitest')
const { ensureAuthorized, UnauthorizedError } = require('../_shared/security')

describe('ensureAuthorized', () => {
  it('allows requests when API_KEY is unset', () => {
    const original = process.env.API_KEY
    delete process.env.API_KEY

    expect(() => ensureAuthorized({ headers: {} })).not.toThrow()

    if (original) process.env.API_KEY = original
  })

  it('throws when key is missing', () => {
    process.env.API_KEY = 'secret'
    expect(() => ensureAuthorized({ headers: {} })).toThrow(UnauthorizedError)
  })

  it('accepts matching header key', () => {
    process.env.API_KEY = 'secret'
    expect(() =>
      ensureAuthorized({ headers: { 'x-api-key': 'secret' } })
    ).not.toThrow()
  })
})
