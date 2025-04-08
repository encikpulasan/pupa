// utils/password.ts - Native crypto password utilities

/**
 * Hash a password using native crypto
 * @param password The plain text password to hash
 * @returns String in format "saltHex:hashHex"
 */
export async function hashPassword(password: string): Promise<string> {
  // Use a secure salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Convert password to bytes
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Combine salt and password
  const combined = new Uint8Array(salt.length + passwordBuffer.length);
  combined.set(salt);
  combined.set(passwordBuffer, salt.length);

  // Hash using SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", combined);

  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  );

  // Encode the salt + hash for storage
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${saltHex}:${hashHex}`;
}

/**
 * Verify a password against a hash
 * @param password The plain text password to verify
 * @param storedHash The stored hash in format "saltHex:hashHex"
 * @returns Boolean indicating if password matches
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  try {
    // Split the hash into salt and hash components
    const [saltHex, hashHex] = storedHash.split(":");

    if (!saltHex || !hashHex) {
      return false;
    }

    // Convert salt from hex to bytes
    const salt = new Uint8Array(
      saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    );

    // Convert password to bytes
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Combine salt and password
    const combined = new Uint8Array(salt.length + passwordBuffer.length);
    combined.set(salt);
    combined.set(passwordBuffer, salt.length);

    // Hash using SHA-256
    const hashBuffer = await crypto.subtle.digest("SHA-256", combined);

    // Convert to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const actualHashHex = hashArray.map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare the hashes
    return hashHex === actualHashHex;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}
