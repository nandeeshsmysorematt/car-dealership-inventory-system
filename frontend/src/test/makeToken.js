export const nowInSeconds = () => Math.floor(Date.now() / 1000)

// Builds an unsigned fake JWT so tests can run without a server.
export function makeToken(payload) {
  const encode = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=+$/, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`
}