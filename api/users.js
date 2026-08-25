/**
 * ================================================
 * GRIDS - Unified User Authentication & Data API
 * ================================================
 *
 * This API handles all user operations (same approach as Notes project):
 * - User authentication (login/create account)
 * - User data storage and retrieval
 * - Spreadsheet data management
 *
 * Uses TextDB for production, local file system for development.
 *
 * Environment Variables:
 * - PEPPER_SECRET: Pepper for secure hashing
 * - NODE_ENV: 'development' or 'production'
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// ================================================
// Configuration
// ================================================

const PEPPER_SECRET = process.env.PEPPER_SECRET || 'dev-pepper-change-in-production-9F2a-5xK8';
const TEXTDB_API_BASE = 'https://textdb.dev/api/data';
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';

// Local development storage path
const DEVELOPMENT_DB_PATH = path.join(__dirname, '..', 'db', 'users');

// ================================================
// Helper Functions
// ================================================

/**
 * Generate SHA-256 hash with pepper (same as Notes project)
 */
function generateHash(input) {
    const normalized = input ? input.trim() : '';
    return crypto.createHash('sha256').update(normalized + PEPPER_SECRET).digest('hex');
}

/**
 * Ensure development database directory exists
 */
function ensureDevelopmentDb() {
    if (!fs.existsSync(DEVELOPMENT_DB_PATH)) {
        fs.mkdirSync(DEVELOPMENT_DB_PATH, { recursive: true });
    }
}

/**
 * Get user data from local development storage
 */
function getDevelopmentUserData(hash) {
    try {
        ensureDevelopmentDb();
        const filePath = path.join(DEVELOPMENT_DB_PATH, `${hash}.json`);

        if (!fs.existsSync(filePath)) {
            return null;
        }

        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('[DEV DB] Error reading user data:', error);
        return null;
    }
}

/**
 * Save user data to local development storage
 */
function saveDevelopmentUserData(hash, userData) {
    try {
        ensureDevelopmentDb();
        const filePath = path.join(DEVELOPMENT_DB_PATH, `${hash}.json`);
        fs.writeFileSync(filePath, JSON.stringify(userData, null, 2), 'utf8');
        console.log(`[DEV DB] Saved user data for hash: ${hash.substring(0, 8)}...`);
        return true;
    } catch (error) {
        console.error('[DEV DB] Error saving user data:', error);
        return false;
    }
}

/**
 * Delete user data from local development storage
 */
function deleteDevelopmentUserData(hash) {
    try {
        ensureDevelopmentDb();
        const filePath = path.join(DEVELOPMENT_DB_PATH, `${hash}.json`);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`[DEV DB] Deleted user data for hash: ${hash.substring(0, 8)}...`);
        }
        return true;
    } catch (error) {
        console.error('[DEV DB] Error deleting user data:', error);
        return false;
    }
}

/**
 * Get user data from TextDB (production)
 */
async function getProductionUserData(hash) {
    try {
        const response = await fetch(`${TEXTDB_API_BASE}/${hash}`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            if (response.status === 404) {
                console.log(`[TEXTDB] User not found: ${hash.substring(0, 8)}...`);
                return null;
            }
            throw new Error(`Failed to fetch: ${response.status}`);
        }

        const text = await response.text();

        // Check for empty or default textdb responses
        if (!text || text.trim() === '' || text.includes('hello world from textdb') || text.length < 10) {
            console.log(`[TEXTDB] Invalid content for: ${hash.substring(0, 8)}...`);
            return null;
        }

        let parsed = JSON.parse(text);
        // Handle double-encoded JSON
        if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
        }

        console.log(`[TEXTDB] Retrieved user data for: ${hash.substring(0, 8)}...`);
        return parsed;
    } catch (error) {
        console.error('[TEXTDB] Error reading user data:', error);
        return null;
    }
}

/**
 * Save user data to TextDB (production)
 */
async function saveProductionUserData(hash, userData) {
    try {
        const response = await fetch(`${TEXTDB_API_BASE}/${hash}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            console.log(`[TEXTDB] Saved user data for: ${hash.substring(0, 8)}...`);
            return true;
        } else {
            console.error(`[TEXTDB] Failed to save: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('[TEXTDB] Error saving user data:', error);
        return false;
    }
}

/**
 * Delete user data from TextDB (production)
 */
async function deleteProductionUserData(hash) {
    try {
        await fetch(`${TEXTDB_API_BASE}/${hash}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(null)
        });
        console.log(`[TEXTDB] Deleted user data for: ${hash.substring(0, 8)}...`);
        return true;
    } catch (error) {
        console.error('[TEXTDB] Error deleting user data:', error);
        return false;
    }
}

/**
 * Get user data (environment-aware)
 */
async function getUserData(hash) {
    if (IS_DEVELOPMENT) {
        return getDevelopmentUserData(hash);
    } else {
        return await getProductionUserData(hash);
    }
}

/**
 * Save user data (environment-aware)
 */
async function saveUserData(hash, userData) {
    if (IS_DEVELOPMENT) {
        return saveDevelopmentUserData(hash, userData);
    } else {
        return await saveProductionUserData(hash, userData);
    }
}

/**
 * Delete user data (environment-aware)
 */
async function deleteUserData(hash) {
    if (IS_DEVELOPMENT) {
        return deleteDevelopmentUserData(hash);
    } else {
        return await deleteProductionUserData(hash);
    }
}

/**
 * Initialize user data structure
 */
function initializeUserData() {
    return {
        settings: {
            theme: 'light',
            createdAt: new Date().toISOString()
        },
        spreadsheets: []
    };
}

// ================================================
// API Handler
// ================================================

module.exports = async function handler(req, res) {
    // Set CORS headers - Allow credentials and dynamic origin
    const origin = req.headers['origin'] || '*';
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // ============================================================
        // GET - Retrieve user data
        // ============================================================
        if (req.method === 'GET') {
            const { hash, shared } = req.query;

            // Handle shared spreadsheet access
            if (shared) {
                console.log(`[API] GET fetching shared spreadsheet: ${shared}`);

                // Try local development storage first
                if (IS_DEVELOPMENT) {
                    const sharedFilePath = path.join(__dirname, '..', 'db', `shared_${shared}.json`);

                    if (!fs.existsSync(sharedFilePath)) {
                        console.log(`[API] Shared spreadsheet not found (404)`);
                        return res.status(404).json({
                            success: false,
                            error: 'Shared spreadsheet not found'
                        });
                    }

                    try {
                        const data = JSON.parse(fs.readFileSync(sharedFilePath, 'utf8'));
                        console.log(`[API] Returning shared spreadsheet: ${data.spreadsheet?.name || 'Untitled'}`);
                        return res.status(200).json({
                            success: true,
                            spreadsheet: data.spreadsheet,
                            sharedAt: data.sharedAt
                        });
                    } catch (parseError) {
                        console.error(`[API] Parse error:`, parseError);
                        return res.status(404).json({
                            success: false,
                            error: 'Shared spreadsheet not found'
                        });
                    }
                }

                // Production: fetch from textdb.dev
                try {
                    const response = await fetch(`${TEXTDB_API_BASE}/shared_${shared}`, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    });

                    if (!response.ok) {
                        console.log(`[API] Shared spreadsheet not found (404)`);
                        return res.status(404).json({
                            success: false,
                            error: 'Shared spreadsheet not found'
                        });
                    }

                    const text = await response.text();
                    console.log(`[API] Shared spreadsheet response length: ${text?.length}`);

                    // Check for empty or invalid content
                    if (!text || text.trim() === '' || text.includes('hello world from textdb') || text.length < 10) {
                        console.log(`[API] Invalid shared spreadsheet content`);
                        return res.status(404).json({
                            success: false,
                            error: 'Shared spreadsheet not found'
                        });
                    }

                    let parsed;
                    try {
                        parsed = JSON.parse(text);
                        if (typeof parsed === 'string') {
                            parsed = JSON.parse(parsed);
                        }
                    } catch (parseError) {
                        console.error(`[API] JSON parse error: ${parseError.message}`);
                        return res.status(404).json({
                            success: false,
                            error: 'Shared spreadsheet not found'
                        });
                    }

                    // Validate structure
                    if (!parsed || typeof parsed !== 'object' || !parsed.spreadsheet) {
                        console.log(`[API] Invalid shared spreadsheet structure`);
                        return res.status(404).json({
                            success: false,
                            error: 'Shared spreadsheet not found'
                        });
                    }

                    console.log(`[API] Returning shared spreadsheet: ${parsed.spreadsheet.name || 'Untitled'}`);
                    return res.status(200).json({
                        success: true,
                        spreadsheet: parsed.spreadsheet,
                        sharedAt: parsed.sharedAt
                    });
                } catch (error) {
                    console.error('[API] Error fetching shared spreadsheet:', error);
                    return res.status(500).json({
                        success: false,
                        error: 'Server error'
                    });
                }
            }

            // Handle regular user data fetch
            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Hash parameter is required'
                });
            }

            console.log(`[API] GET user data for: ${hash.substring(0, 8)}...`);
            const userData = await getUserData(hash);

            if (!userData) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            return res.status(200).json({
                success: true,
                data: userData
            });
        }

        // ============================================================
        // POST - Login or Create Account
        // ============================================================
        if (req.method === 'POST') {
            const { key, action } = req.body;

            if (!key || typeof key !== 'string') {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid key format'
                });
            }

            const normalizedKey = key.trim();
            if (normalizedKey === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Key cannot be empty'
                });
            }

            const hash = generateHash(normalizedKey);
            console.log(`[API] POST action: ${action}, hash: ${hash.substring(0, 8)}...`);

            // LOGIN ACTION
            if (action === 'login') {
                const userData = await getUserData(hash);

                if (!userData) {
                    return res.status(404).json({
                        success: false,
                        error: 'User not found'
                    });
                }

                return res.status(200).json({
                    success: true,
                    hash: hash,
                    data: userData,
                    message: 'Login successful'
                });
            }

            // CREATE ACCOUNT ACTION
            if (action === 'create') {
                const existingUserData = await getUserData(hash);

                if (existingUserData) {
                    return res.status(409).json({
                        success: false,
                        error: 'User already exists'
                    });
                }

                const newUserData = initializeUserData();
                const saved = await saveUserData(hash, newUserData);

                if (!saved) {
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to create account'
                    });
                }

                return res.status(201).json({
                    success: true,
                    hash: hash,
                    data: newUserData,
                    message: 'Account created successfully'
                });
            }

            return res.status(400).json({
                success: false,
                error: 'Invalid action. Use "login" or "create"'
            });
        }

        // ============================================================
        // PUT - Update user data
        // ============================================================
        if (req.method === 'PUT') {
            console.log('[API] PUT request body:', JSON.stringify(req.body));
            const { hash, action, data } = req.body;

            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Hash is required'
                });
            }

            console.log(`[API] PUT action: ${action}, hash: ${hash.substring(0, 8)}...`);

            // Get current user data
            let userData = await getUserData(hash);

            if (!userData) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // UPDATE SPREADSHEET DATA
            if (action === 'updateSpreadsheet') {
                const { spreadsheetId, spreadsheetData } = data;

                console.log(`[API] Update spreadsheet request - ID: ${spreadsheetId}`);
                console.log(`[API] Spreadsheet data ID: ${spreadsheetData?.id}`);
                console.log(`[API] Current spreadsheets count: ${userData.spreadsheets?.length || 0}`);

                if (!userData.spreadsheets) {
                    userData.spreadsheets = [];
                }

                const existingIndex = userData.spreadsheets.findIndex(
                    s => s.id === spreadsheetId
                );

                console.log(`[API] Existing spreadsheet index: ${existingIndex}`);

                if (existingIndex >= 0) {
                    // Update existing spreadsheet - ensure ID consistency
                    userData.spreadsheets[existingIndex] = {
                        ...userData.spreadsheets[existingIndex],
                        ...spreadsheetData,
                        id: spreadsheetId, // Ensure ID matches exactly
                        updatedAt: new Date().toISOString()
                    };
                    console.log(`[API] Updated existing spreadsheet: ${spreadsheetId}`);
                } else {
                    // Create new spreadsheet
                    userData.spreadsheets.push({
                        id: spreadsheetId, // Ensure ID matches exactly
                        ...spreadsheetData,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                    console.log(`[API] Created new spreadsheet: ${spreadsheetId}`);
                }

                console.log(`[API] Total spreadsheets after update: ${userData.spreadsheets.length}`);

                const saved = await saveUserData(hash, userData);

                if (saved) {
                    return res.status(200).json({
                        success: true,
                        data: userData
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to update spreadsheet'
                    });
                }
            }

            // DELETE SPREADSHEET
            if (action === 'deleteSpreadsheet') {
                const { spreadsheetId } = data;

                if (!userData.spreadsheets) {
                    userData.spreadsheets = [];
                }

                // Find spreadsheet to check for shared copy
                const spreadsheetToDelete = userData.spreadsheets.find(
                    s => s.id === spreadsheetId
                );

                // Delete shared copy if exists
                if (spreadsheetToDelete?.sharedId) {
                    try {
                        console.log(`[API] Deleting shared copy: shared_${spreadsheetToDelete.sharedId}`);

                        if (IS_DEVELOPMENT) {
                            // Development: delete local file
                            const sharedFilePath = path.join(__dirname, '..', 'db', `shared_${spreadsheetToDelete.sharedId}.json`);
                            if (fs.existsSync(sharedFilePath)) {
                                fs.unlinkSync(sharedFilePath);
                            }
                            console.log(`[API] Shared copy deleted from local file`);
                        } else {
                            // Production: delete from textdb.dev
                            await fetch(`${TEXTDB_API_BASE}/shared_${spreadsheetToDelete.sharedId}`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Accept': 'application/json'
                                },
                                body: JSON.stringify(null)
                            });
                            console.log(`[API] Shared copy deleted from textdb.dev`);
                        }
                    } catch (e) {
                        console.error('[API] Failed to delete shared copy:', e);
                        // Continue anyway - the user's copy should still be deleted
                    }
                }

                userData.spreadsheets = userData.spreadsheets.filter(
                    s => s.id !== spreadsheetId
                );

                console.log(`[API] Deleted spreadsheet: ${spreadsheetId}`);

                const saved = await saveUserData(hash, userData);

                if (saved) {
                    return res.status(200).json({
                        success: true,
                        data: userData
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to delete spreadsheet'
                    });
                }
            }

            // UPDATE SETTINGS
            if (action === 'updateSettings') {
                userData.settings = {
                    ...userData.settings,
                    ...data.settings,
                    updatedAt: new Date().toISOString()
                };

                console.log(`[API] Updated settings`);

                const saved = await saveUserData(hash, userData);

                if (saved) {
                    return res.status(200).json({
                        success: true,
                        data: userData
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to update settings'
                    });
                }
            }

            // SHARE SPREADSHEET
            if (action === 'shareSpreadsheet') {
                const { spreadsheetId } = data;

                if (!userData.spreadsheets) {
                    userData.spreadsheets = [];
                }

                const spreadsheetIndex = userData.spreadsheets.findIndex(
                    s => s.id === spreadsheetId
                );

                if (spreadsheetIndex === -1) {
                    return res.status(404).json({
                        success: false,
                        error: 'Spreadsheet not found'
                    });
                }

                // Check if already shared
                if (userData.spreadsheets[spreadsheetIndex].sharedId) {
                    const existingShareId = userData.spreadsheets[spreadsheetIndex].sharedId;
                    console.log(`[API] Spreadsheet already shared: ${existingShareId}`);

                    // Generate share URL
                    let protocol;
                    let host;

                    if (IS_DEVELOPMENT) {
                        protocol = 'http';
                        host = req.headers['host'] || 'localhost:3000';
                        // Ensure we have the port
                        if (host === 'localhost') {
                            host = 'localhost:3000';
                        }
                    } else {
                        protocol = req.headers['x-forwarded-proto'] || 'https';
                        host = req.headers['host'] || req.headers['x-vercel-forwarded-for'] || 'localhost';
                    }

                    const baseUrl = `${protocol}://${host}`;
                    const shareUrl = `${baseUrl}/shared.html?shared=${existingShareId}`;

                    return res.status(200).json({
                        success: true,
                        shareId: existingShareId,
                        shareUrl: shareUrl,
                        alreadyShared: true
                    });
                }

                // Generate new share ID
                const newShareId = Date.now().toString(36) + Math.random().toString(36).substring(2);
                console.log(`[API] Creating new share: ${newShareId}`);

                // Prepare share data
                const shareData = {
                    spreadsheet: userData.spreadsheets[spreadsheetIndex],
                    sharedAt: new Date().toISOString()
                };

                // Store shared spreadsheet - development uses local files, production uses textdb.dev
                if (IS_DEVELOPMENT) {
                    // Development: save to local file system
                    try {
                        const sharedFilePath = path.join(__dirname, '..', 'db', `shared_${newShareId}.json`);
                        fs.writeFileSync(sharedFilePath, JSON.stringify(shareData, null, 2), 'utf8');
                        console.log(`[API] Shared spreadsheet saved to local file`);
                    } catch (e) {
                        console.error('[API] Failed to save shared spreadsheet locally:', e);
                        return res.status(500).json({
                            success: false,
                            error: 'Failed to create share'
                        });
                    }
                } else {
                    // Production: save to textdb.dev (server-side, no CORS issues)
                    try {
                        const textdbResponse = await fetch(`${TEXTDB_API_BASE}/shared_${newShareId}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Accept': 'application/json'
                            },
                            body: JSON.stringify(shareData)
                        });

                        if (!textdbResponse.ok) {
                            console.error(`[API] Failed to save to textdb.dev: ${textdbResponse.status}`);
                            return res.status(500).json({
                                success: false,
                                error: 'Failed to create share'
                            });
                        }

                        console.log(`[API] Shared spreadsheet saved to textdb.dev`);
                    } catch (e) {
                        console.error('[API] Failed to save shared spreadsheet:', e);
                        return res.status(500).json({
                            success: false,
                            error: 'Failed to create share'
                        });
                    }
                }

                // Update spreadsheet with sharedId
                userData.spreadsheets[spreadsheetIndex].sharedId = newShareId;

                // Save updated user data
                const saved = await saveUserData(hash, userData);

                if (!saved) {
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to update spreadsheet'
                    });
                }

                // Generate share URL
                let protocol;
                let host;

                if (IS_DEVELOPMENT) {
                    protocol = 'http';
                    host = req.headers['host'] || 'localhost:3000';
                    // Ensure we have the port
                    if (host === 'localhost') {
                        host = 'localhost:3000';
                    }
                } else {
                    protocol = req.headers['x-forwarded-proto'] || 'https';
                    host = req.headers['host'] || req.headers['x-vercel-forwarded-for'] || 'localhost';
                }

                const baseUrl = `${protocol}://${host}`;
                const shareUrl = `${baseUrl}/shared.html?shared=${newShareId}`;

                console.log(`[API] Share created: ${shareUrl}`);

                return res.status(200).json({
                    success: true,
                    shareId: newShareId,
                    shareUrl: shareUrl,
                    alreadyShared: false
                });
            }

            return res.status(400).json({
                success: false,
                error: 'Invalid action'
            });
        }

        // ============================================================
        // DELETE - Delete user account
        // ============================================================
        if (req.method === 'DELETE') {
            const { hash } = req.query;

            if (!hash) {
                return res.status(400).json({
                    success: false,
                    error: 'Hash is required'
                });
            }

            console.log(`[API] DELETE user: ${hash.substring(0, 8)}...`);

            const deleted = await deleteUserData(hash);

            if (deleted) {
                return res.status(200).json({
                    success: true,
                    message: 'Account deleted successfully'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    error: 'Failed to delete account'
                });
            }
        }

        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });

    } catch (error) {
        console.error('[API] Error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message
        });
    }
};
