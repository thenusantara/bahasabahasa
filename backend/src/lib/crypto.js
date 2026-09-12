const encoder = new TextEncoder();

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function bytesToBase64Url(bytes) {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export function createId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function createSessionToken() {
  const bytes = crypto.getRandomValues(
    new Uint8Array(32)
  );

  return bytesToBase64Url(bytes);
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    encoder.encode(value)
  );

  return bytesToHex(new Uint8Array(digest));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const iterations = 210000;

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt,
      iterations
    },
    keyMaterial,
    256
  );

  return [
    "pbkdf2-sha256",
    iterations,
    bytesToHex(salt),
    bytesToHex(new Uint8Array(derivedBits))
  ].join("$");
}

function hexToBytes(hex) {
  if (
    typeof hex !== "string" ||
    hex.length % 2 !== 0 ||
    !/^[0-9a-f]+$/i.test(hex)
  ) {
    throw new Error("Invalid hexadecimal value.");
  }

  const bytes = new Uint8Array(hex.length / 2);

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Number.parseInt(
      hex.slice(i * 2, i * 2 + 2),
      16
    );
  }

  return bytes;
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  let difference = 0;

  for (let i = 0; i < left.length; i += 1) {
    difference |= left[i] ^ right[i];
  }

  return difference === 0;
}

export async function verifyPassword(
  password,
  storedHash
) {
  try {
    const [
      algorithm,
      iterationsText,
      saltHex,
      expectedHex
    ] = storedHash.split("$");

    if (algorithm !== "pbkdf2-sha256") {
      return false;
    }

    const iterations = Number(iterationsText);

    if (
      !Number.isInteger(iterations) ||
      iterations <= 0
    ) {
      return false;
    }

    const salt = hexToBytes(saltHex);
    const expected = hexToBytes(expectedHex);

    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt,
        iterations
      },
      keyMaterial,
      expected.length * 8
    );

    return timingSafeEqual(
      new Uint8Array(derivedBits),
      expected
    );
  } catch {
    return false;
  }
}