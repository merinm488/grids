/**
 * ================================================
 * GRIDS - Vercel Serverless Function for Storage
 * ================================================
 *
 * This API endpoint handles storage operations using TextDB
 * - Uses user hash as TextDB identifier (same as Notes project)
 * - Supports save, load, delete operations
 * - Simple key-value storage like Notes project
 *
 * Environment Variables Required:
 * - PEPPER_SECRET: Pepper for secure hashing (same as Notes)
 */

const TEXTDB_API_BASE = 'https://textdb.dev/api/data';

/**
 * Get user data from textdb.dev
 * @param {string} hash - User's hash (used as textdb.dev identifier)
 * @returns {Promise<Object|null>} - User data or null if not found
 */
async function getUserData(hash) {
  try {
    console.log(`[TEXTDB GET] Fetching hash: ${hash}`);
    const response = await fetch(`${TEXTDB_API_BASE}/${hash}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log(`[TEXTDB GET] Response status: ${response.status}`);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[TEXTDB GET] User not found (404)`);
        return null;
      }
      throw new Error(`Failed to fetch data: ${response.status}`);
    }

    const text = await response.text();
    console.log(`[TEXTDB GET] Response text length: ${text?.length}`);

    // textdb.dev returns default content for non-existent keys
    // Check for empty, whitespace, or default textdb responses
    if (!text || text.trim() === '' || text.includes('hello world from textdb') || text.length < 10) {
      console.log(`[TEXTDB GET] Default/empty/invalid content, returning null`);
      return null;
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
      // textdb.dev sometimes returns JSON-encoded strings (double-encoded)
      // If we got a string, parse it again
      if (typeof parsed === 'string') {
        console.log(`[TEXTDB GET] Got string, parsing again...`);
        parsed = JSON.parse(parsed);
      }
    } catch (parseError) {
      console.error(`[TEXTDB GET] JSON parse error: ${parseError.message}`);
      return null;
    }

    // Validate that we have actual user data structure
    if (!parsed || typeof parsed !== 'object') {
      console.log(`[TEXTDB GET] Invalid user data structure, returning null`);
      return null;
    }

    console.log(`[TEXTDB GET] Valid user data`);
    return parsed;
  } catch (error) {
    console.error('[TEXTDB GET] Error reading user data:', error);
    return null;
  }
}

/**
 * Save user data to textdb.dev
 * @param {string} hash - User's hash (used as textdb.dev identifier)
 * @param {Object} userData - User data to save
 * @returns {Promise<boolean>} - Success status
 */
async function saveUserData(hash, userData) {
  try {
    console.log(`[TEXTDB POST] Saving hash: ${hash} with ${JSON.stringify(userData).length} bytes`);
    const response = await fetch(`${TEXTDB_API_BASE}/${hash}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    console.log(`[TEXTDB POST] Response status: ${response.status}, ok: ${response.ok}`);
    if (!response.ok) {
      const responseText = await response.text();
      console.error(`[TEXTDB POST] Error response: ${responseText}`);
      throw new Error(`Failed to save data: ${response.status}`);
    }

    let responseText = await response.text();
    console.log(`[TEXTDB POST] Response text: "${responseText?.substring(0, 200)}"`);

    // Verify the save worked by checking the response
    if (responseText && responseText.trim() !== '' && !responseText.includes('hello world from textdb')) {
      console.log(`[TEXTDB POST] Save appears successful`);
      return true;
    } else {
      console.warn(`[TEXTDB POST] Response looks suspicious: "${responseText}"`);
      // Still return true since response.ok was true
      return true;
    }
  } catch (error) {
    console.error('[TEXTDB POST] Error saving user data:', error);
    return false;
  }
}

/**
 * Check if user exists
 * @param {string} hash - User's hash
 * @returns {Promise<boolean>} - Whether user exists
 */
async function userExists(hash) {
  const userData = await getUserData(hash);
  return userData !== null;
}

/**
 * Vercel Serverless Function Handler
 */
module.exports = async function handler(req, res) {
    // Set CORS headers - Allow credentials and dynamic origin
    const origin = req.headers['origin'] || '*';
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Key, Authorization'
    );
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            const { action, hash } = req.query;

            if (!action || !hash) {
                return res.status(400).json({ success: false, error: 'Action and hash are required' });
            }

            switch (action) {
                case 'load':
                    const userData = await getUserData(hash);
                    if (!userData) {
                        return res.status(404).json({ success: false, error: 'User not found' });
                    }
                    return res.status(200).json({ success: true, data: userData });

                default:
                    return res.status(400).json({ success: false, error: 'Invalid action' });
            }
        }

        if (req.method === 'POST') {
            const { action, hash, data } = req.body;

            if (!action || !hash) {
                return res.status(400).json({ success: false, error: 'Action and hash are required' });
            }

            switch (action) {
                case 'save':
                    const saved = await saveUserData(hash, data);
                    if (saved) {
                        return res.status(200).json({ success: true });
                    } else {
                        return res.status(500).json({ success: false, error: 'Failed to save data' });
                    }

                case 'delete':
                    // Delete from textdb.dev by sending empty content
                    try {
                        await fetch(`${TEXTDB_API_BASE}/${hash}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(null)
                        });
                    } catch (error) {
                        console.error('Delete error:', error);
                    }
                    return res.status(200).json({ success: true });

                default:
                    return res.status(400).json({ success: false, error: 'Invalid action' });
            }
        }

        return res.status(405).json({ success: false, error: 'Method not allowed' });

    } catch (error) {
        console.error('Storage API error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
}
