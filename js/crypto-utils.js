/**
 * ================================================
 * GRIDS - Cryptographic Utilities
 * ================================================
 *
 * This module handles secure hashing for access keys:
 * - Uses same approach as Notes project
 * - Server-side hashing via API
 * - SHA-256 hex encoding (simpler than Base64)
 *
 * SECURITY NOTES:
 * - The pepper is only used server-side
 * - Client-side code calls the hashing API
 * - Hash is used as TextDB identifier
 */

// ================================================
// Main Crypto Functions
// ================================================

/**
 * Hash an access key with pepper for secure storage
 * Uses server-side hashing (same approach as Notes project)
 *
 * @param {string} rawKey - The raw access key entered by user
 * @returns {Promise<string>} The final hashed key (hex format)
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
            const devPepper = 'dev-pepper-change-in-production-9F2a-5xK8';
            const pepperedInput = rawKey + devPepper;
            const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pepperedInput));
            return bufferToHex(hashBuffer);
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
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionInput));
    return bufferToHex(hashBuffer);
}

// ================================================
// Helper Functions
// ================================================

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
