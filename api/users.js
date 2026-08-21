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
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        // ============================================================
        // GET - Retrieve user data
        // ============================================================
        if (req.method === 'GET') {
            const { hash } = req.query;

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
