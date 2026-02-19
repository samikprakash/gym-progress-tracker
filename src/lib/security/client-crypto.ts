const toHex = (bytes: Uint8Array) =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

export const sha256Hex = async (value: string) => {
  const encoder = new TextEncoder()
  const encodedValue = encoder.encode(value)
  const digestBuffer = await globalThis.crypto.subtle.digest('SHA-256', encodedValue)

  return toHex(new Uint8Array(digestBuffer))
}
