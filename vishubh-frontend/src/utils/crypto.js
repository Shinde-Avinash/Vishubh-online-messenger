/**
 * Utility functions for End-to-End Encryption (E2EE) using RSA-OAEP.
 * This file must be imported by AppContext.jsx.
 */

/**
 * Generates a new RSA-OAEP key pair for E2EE.
 * @returns {Promise<{keyPair: CryptoKeyPair, publicKey: string}>}
 */
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash: 'SHA-256',
    },
    true, // Key is extractable
    ['encrypt', 'decrypt']
  );

  // Export the public key as a JWK string to be stored on the server
  const exportedPublicKey = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
  const publicKey = JSON.stringify(exportedPublicKey);

  return { keyPair, publicKey };
};

/**
 * Encrypts a message using a recipient's public key.
 * @param {string} message - The plain text message.
 * @param {string} rawRecipientPublicKey - The recipient's public key (JWK string).
 * @returns {Promise<string>} - The encrypted message as a base64 string.
 */
export const encryptMessage = async (message, rawRecipientPublicKey) => {
  const publicKeyJwk = JSON.parse(rawRecipientPublicKey);

  const publicKey = await window.crypto.subtle.importKey(
    'jwk',
    publicKeyJwk,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );

  const encodedMessage = new TextEncoder().encode(message);

  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    encodedMessage
  );

  // Convert ArrayBuffer to base64 string
  return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
};

/**
 * Decrypts a message using the user's private key.
 * @param {string} encryptedBase64 - The encrypted message as a base64 string.
 * @param {CryptoKey} privateKey - The user's private key object.
 * @returns {Promise<string>} - The decrypted plain text message.
 */
export const decryptMessage = async (encryptedBase64, privateKey) => {
  // Convert base64 string back to ArrayBuffer
  const binaryString = atob(encryptedBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    bytes.buffer
  );

  // Convert ArrayBuffer back to text
  return new TextDecoder().decode(decrypted);
};