/**
 * ================================================
 * GRIDS - Cryptographic Utilities
 * ================================================
 *
 * This module handles secure hashing for access keys with:
 * - Pepper hashing for additional security
 * - SHA-256 for key derivation
 * - Base64 encoding for storage
 *
 * SECURITY NOTES:
 * - The pepper is stored separately (server-side in production)
 * - Pepper is never exposed to client-side code in production
 * - For local development, a default pepper is used
 *
 * The hashing process:
 * 1. User enters raw key
 * 2. Pepper name is concatenated with the raw key
 * 3. Result is hashed with SHA-256
 * 4. Result is Base64 encoded for storage
 */

// ================================================
// Configuration
// ================================================

const CRYPTO_CONFIG = {
    // Pepper identifier (used to select the actual pepper value)
    // In production, this maps to a server-side pepper value
    pepperName: 'grids_primary_pepper_v1',

    // For local development only - DO NOT use in production
    // In production, the actual pepper value should be stored:
    // - Server-side in environment variables
    // - In a secure secrets manager
    // - Never exposed to client-side code
    developmentPepper: 'grids_dev_pepper_change_in_production_2024',

    // Hash algorithm to use
    hashAlgorithm: 'SHA-256',

    // Encoding for final output
    outputEncoding: 'base64',
};

// ================================================
// Main Crypto Functions
// ================================================

/**
 * Hash an access key with pepper for secure storage
 *
 * PROCESS:
 * 1. Concatenate pepper name with the raw key
 * 2. Hash the result with SHA-256
 * 3. Base64 encode for storage
 *
 * @param {string} rawKey - The raw access key entered by user
 * @returns {Promise<string>} The final hashed and encoded key
 */
async function hashAccessKey(rawKey) {
    try {
        // Check if in production environment
        const isProduction = window.location.hostname !== 'localhost' &&
                           window.location.hostname !== '127.0.0.1' &&
                           !window.location.hostname.startsWith('192.168.');

        if (isProduction) {
            // Production: Use server-side hashing via API
            return await hashAccessKeyServerSide(rawKey);
        } else {
            // Development: Use client-side hashing with hardcoded pepper
            // Step 1: Initial hash of the raw key
            // const initialHash = await sha256Hash(rawKey);

            // Step 2: Concatenate pepper name with rawKey
            const pepperedInput = `${CRYPTO_CONFIG.pepperName}:${rawKey}`;

            // Step 3: Hash the peppered input
            const finalHash = await sha256Hash(pepperedInput);

            // Step 4: Encode for storage
            const encodedKey = base64Encode(finalHash);

            return encodedKey;
        }
    } catch (error) {
        console.error('Error hashing access key:', error);
        throw new Error('Failed to hash access key');
    }
}

/**
 * Verify an access key against a stored hash
 *
 * @param {string} rawKey - The raw access key to verify
 * @param {string} storedHash - The stored hash to compare against
 * @returns {Promise<boolean>} True if the key matches
 */
async function verifyAccessKey(rawKey, storedHash) {
    try {
        const hashedKey = await hashAccessKey(rawKey);
        return hashedKey === storedHash;
    } catch (error) {
        console.error('Error verifying access key:', error);
        return false;
    }
}

/**
 * Generate a unique session token for authenticated users
 *
 * @param {string} hashedKey - The user's hashed access key
 * @returns {Promise<string>} A unique session token
 */
async function generateSessionToken(hashedKey) {
    const timestamp = Date.now().toString();
    const randomStr = generateRandomString(32);
    const sessionInput = `${hashedKey}:${timestamp}:${randomStr}`;
    const sessionHash = await sha256Hash(sessionInput);
    return base64Encode(sessionHash);
}

// ================================================
// Helper Functions
// ================================================

/**
 * Compute SHA-256 hash of a string
 *
 * @param {string} input - String to hash
 * @returns {Promise<string>} Hex-encoded hash
 */
async function sha256Hash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest(
        CRYPTO_CONFIG.hashAlgorithm,
        data
    );
    return bufferToHex(hashBuffer);
}

/**
 * Convert ArrayBuffer to hex string
 *
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Hex-encoded string
 */
function bufferToHex(buffer) {
    const byteArray = new Uint8Array(buffer);
    const hexArray = Array.from(byteArray);
    const hexString = hexArray
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    return hexString;
}

/**
 * Base64 encode a string
 *
 * @param {string} input - String to encode
 * @returns {string} Base64-encoded string
 */
function base64Encode(input) {
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
        return base64;
    } catch (error) {
        console.error('Error base64 encoding:', error);
        throw new Error('Failed to encode data');
    }
}

/**
 * Generate a cryptographically secure random string
 *
 * @param {number} length - Length of random string
 * @returns {string} Random hex string
 */
function generateRandomString(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
}


/**
 * Hash access key using server-side pepper (production method)
 *
 * This is the PRODUCTION approach where the actual pepper
 * value never leaves the server.
 *
 * @param {string} rawKey - The raw access key
 * @returns {Promise<string>} The final hashed key
 */
async function hashAccessKeyServerSide(rawKey) {
    try {
        const response = await fetch('/api/auth/hash', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rawKey: rawKey })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.hashedKey) {
            return data.hashedKey;
        } else {
            throw new Error(data.error || 'Hashing failed');
        }
    } catch (error) {
        console.error('Server-side hashing error:', error);
        throw new Error('Failed to hash key on server');
    }
}

// ================================================
// Validation
// ================================================

/**
 * Validate an access key format before hashing
 *
 * @param {string} key - Key to validate
 * @returns {Object} Validation result with isValid and message
 */
function validateAccessKey(key) {
    // Only check if key is empty - no other restrictions
    if (!key || typeof key !== 'string') {
        return { isValid: false, message: 'Key is required' };
    }

    if (key.trim() === '') {
        return { isValid: false, message: 'Key cannot be empty' };
    }

    return { isValid: true, message: 'Key is valid' };
}

// ================================================
// Export
// ================================================

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.CryptoUtils = {
        hashAccessKey,
        verifyAccessKey,
        generateSessionToken,
        validateAccessKey,
        hashAccessKeyServerSide,
    };

    // Also export individual functions for convenience
    window.hashAccessKey = hashAccessKey;
    window.verifyAccessKey = verifyAccessKey;
    window.generateSessionToken = generateSessionToken;
    window.validateAccessKey = validateAccessKey;
}
