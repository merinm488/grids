/**
 * ================================================
 * GRIDS - Vercel Serverless Function for Key Hashing
 * ================================================
 *
 * This API endpoint performs secure server-side hashing:
 * - Uses same approach as Notes project
 * - Simple key + pepper → SHA-256 hash
 * - Returns only the final hash
 *
 * Environment Variables Required:
 * - PEPPER_SECRET: The pepper value (set in Vercel dashboard)
 */

const crypto = require('crypto');

// Get pepper from environment or use development fallback (same as Notes)
const PEPPER_SECRET = process.env.PEPPER_SECRET || 'dev-pepper-change-in-production-9F2a-5xK8';

/**
 * Generate SHA-256 hash with pepper (same as Notes project)
 * @param {string} input - String to hash
 * @returns {string} Hex-encoded hash
 */
function generateHash(input) {
    return crypto.createHash('sha256').update(input + PEPPER_SECRET).digest('hex');
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

        // Normalize key - just trim whitespace (same as Notes)
        const normalizedKey = rawKey.trim();

        // Generate hash using the same method as Notes project
        const hash = generateHash(normalizedKey);

        console.log(`[HASH] Generated hash for key: ${hash.substring(0, 8)}...`);

        // Return only the hash (never the pepper)
        return res.status(200).json({
            success: true,
            hashedKey: hash
        });

    } catch (error) {
        console.error('Hashing error:', error);
        return res.status(500).json({
            error: 'Hashing failed',
            message: error.message
        });
    }
}
