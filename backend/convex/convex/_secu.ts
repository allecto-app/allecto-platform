const textEncoder = new TextEncoder();

function getCrypto(): Crypto {
  if (!globalThis.crypto) {
    throw new Error("Crypto API unavailable");
  }
  return globalThis.crypto;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function randomToken(bytes = 32): string {
  const array = new Uint8Array(bytes);
  getCrypto().getRandomValues(array);
  return toHex(array);
}

export async function sha256(value: string): Promise<string> {
  const digest = await getCrypto().subtle.digest(
    "SHA-256",
    textEncoder.encode(value),
  );
  return toHex(new Uint8Array(digest));
}
