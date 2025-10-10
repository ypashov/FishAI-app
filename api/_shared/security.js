'use strict'

// Lightweight auth helper for Azure Functions. Used to gate access with a shared API key.
class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
    this.statusCode = 401
  }
}

// Throws if the provided request does not include the configured API key.
function ensureAuthorized(req) {
  const expectedKey = process.env.API_KEY
  if (!expectedKey) return

  const headers = req.headers || {}
  const providedKey = headers['x-api-key'] || headers['X-API-KEY'] || req.query?.api_key

  if (!providedKey || providedKey !== expectedKey) {
    throw new UnauthorizedError('Invalid or missing API key.')
  }
}

module.exports = {
  // Re-export for downstream functions.
  ensureAuthorized,
  UnauthorizedError
}
