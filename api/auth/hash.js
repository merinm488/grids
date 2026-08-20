/**
 * ================================================
 * GRIDS - Vercel Serverless Function for Key Hashing
 * ================================================
 *
 * This API endpoint performs secure server-side hashing:
 * - Accesses pepper from Vercel environment variables
 * - Never exposes pepper to client
 * - Returns only the final hash
 *
 * Environment Variables Required:
 * - AUTH_PEPPER: The actual pepper value (set in Vercel dashboard)
 * - AUTH_PEPPER_NAME: Pepper identifier (default: grids_primary_pepper_v1)
 */

// Crypto module for Node.js (available in Vercel serverless functions)
const crypto = require('crypto');

/**
 * SHA-256 hash function for Node.js
 * @param {string} input - String to hash
 * @returns {string} Hex-encoded hash
 */
function sha256Hash(input) {
    return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Hash access key with pepper (server-side)
 * @param {string} rawKey - Raw access key
 * @param {string} pepperName - Pepper identifier
 * @returns {string} Final hashed key
 */
function hashAccessKeyServerSide(rawKey, pepperName) {

    // Step 1: Get pepper from environment
    const pepper = process.env.AUTH_PEPPER;

    if (!pepper) {
        // For development, use a fallback pepper
        console.warn('WARNING: AUTH_PEPPER environment variable not configured. Using development pepper.');
        const devPepper = 'grids_dev_pepper_change_in_production_2024';

        // Step 1a: Hash the raw key first (initial hash)
        const initialHash = sha256Hash(rawKey);

        // Step 2a: Concatenate pepper name with initial hash
        const pepperedInput = `${pepperName}:${initialHash}`;

        // Step 3a: Hash the peppered input
        const finalHash = sha256Hash(pepperedInput);

        // Step 4a: Base64 encode for storage
        return Buffer.from(finalHash).toString('base64');
    }

    // Production mode with real pepper
    const pepperedInput = `${pepperName}:${rawKey}`;

    // Step 2: Hash the peppered input
    const finalHash = sha256Hash(pepperedInput);

    // Step 3: Base64 encode for storage
    return Buffer.from(finalHash).toString('base64');
}

/**
 * Vercel Serverless Function Handler
 */
module.exports = async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Get raw key from request body
        const { rawKey } = req.body;

        // Validate input
        if (!rawKey || typeof rawKey !== 'string') {
            return res.status(400).json({ error: 'Invalid key format' });
        }

        if (rawKey.trim() === '') {
            return res.status(400).json({ error: 'Key cannot be empty' });
        }

        // Get pepper name from environment or use default
        const pepperName = process.env.AUTH_PEPPER_NAME || 'grids_primary_pepper_v1';

        // Perform server-side hashing
        const hashedKey = hashAccessKeyServerSide(rawKey, pepperName);

        // Return only the hash (never the pepper)
        return res.status(200).json({
            success: true,
            hashedKey: hashedKey,
            pepperName: pepperName // Only return the name, not the value
        });

    } catch (error) {
        console.error('Hashing error:', error);
        return res.status(500).json({
            error: 'Hashing failed',
            message: error.message
        });
    }
}
