/**
 * ================================================
 * GRIDS - Vercel Serverless Function for Storage
 * ================================================
 *
 * This API endpoint handles storage operations:
 * - Routes client storage requests to TextDB
 * - Supports save, load, delete, and list operations
 * - Hides TextDB implementation details
 *
 * Environment Variables Required:
 * - TEXTDB_COLLECTION_ID: Your TextDB collection ID
 * - TEXTDB_API_KEY: Optional API key for TextDB
 */

const https = require('https');

/**
 * TextDB configuration
 */
const TEXTDB_CONFIG = {
    baseUrl: process.env.TEXTDB_BASE_URL || 'https://textdb.dev/api/data',
    collectionId: process.env.TEXTDB_COLLECTION_ID || 'YOUR_COLLECTION_ID',
    apiKey: process.env.TEXTDB_API_KEY || '',
};

/**
 * Make HTTPS request to TextDB
 */
function makeTextDBRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);

        const reqOptions = {
            hostname: urlObj.hostname,
            port: 443,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(TEXTDB_CONFIG.apiKey && { 'Authorization': `Bearer ${TEXTDB_CONFIG.apiKey}` }),
                ...options.headers,
            },
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

/**
 * Load data from TextDB
 */
async function loadFromTextDB(id) {
    const url = `${TEXTDB_CONFIG.baseUrl}/${TEXTDB_CONFIG.collectionId}/${id}`;

    try {
        const response = await makeTextDBRequest(url, { method: 'GET' });

        if (response.status === 404) {
            return { success: true, data: null };
        }

        if (response.status !== 200) {
            return { success: false, error: 'Failed to load data' };
        }

        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        console.error('Load error:', error);
        return { success: false, error: 'Failed to load data' };
    }
}

/**
 * Save data to TextDB
 */
async function saveToTextDB(id, data) {
    const url = `${TEXTDB_CONFIG.baseUrl}/${TEXTDB_CONFIG.collectionId}/${id}`;

    try {
        const response = await makeTextDBRequest(url, {
            method: 'POST',
            body: {
                collectionId: TEXTDB_CONFIG.collectionId,
                data: data,
                id: id,
            },
        });

        return response.status === 200
            ? { success: true }
            : { success: false, error: 'Failed to save data' };
    } catch (error) {
        console.error('Save error:', error);
        return { success: false, error: 'Failed to save data' };
    }
}

/**
 * Delete data from TextDB
 */
async function deleteFromTextDB(id) {
    const url = `${TEXTDB_CONFIG.baseUrl}/${TEXTDB_CONFIG.collectionId}/${id}`;

    try {
        const response = await makeTextDBRequest(url, { method: 'DELETE' });

        // 404 is OK (already deleted)
        return response.status === 200 || response.status === 404
            ? { success: true }
            : { success: false, error: 'Failed to delete data' };
    } catch (error) {
        console.error('Delete error:', error);
        return { success: false, error: 'Failed to delete data' };
    }
}

/**
 * List all documents in TextDB collection
 */
async function listFromTextDB() {
    const url = `${TEXTDB_CONFIG.baseUrl}/${TEXTDB_CONFIG.collectionId}`;

    try {
        const response = await makeTextDBRequest(url, { method: 'GET' });

        if (response.status !== 200) {
            return { success: false, error: 'Failed to list data' };
        }

        const documents = Array.isArray(response.data)
            ? response.data
            : (response.data.documents || []);

        return { success: true, data: documents };
    } catch (error) {
        console.error('List error:', error);
        return { success: false, error: 'Failed to list data' };
    }
}

/**
 * Vercel Serverless Function Handler
 */
module.exports = async function handler(req, res) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Key, Authorization'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET') {
            const { action, id } = req.query;

            if (!action) {
                return res.status(400).json({ success: false, error: 'Action parameter is required' });
            }

            switch (action) {
                case 'load':
                    if (!id) {
                        return res.status(400).json({ success: false, error: 'ID parameter is required for load action' });
                    }
                    const loadResult = await loadFromTextDB(id);
                    return res.status(loadResult.success ? 200 : 500).json(loadResult);

                case 'list':
                    const listResult = await listFromTextDB();
                    return res.status(listResult.success ? 200 : 500).json(listResult);

                default:
                    return res.status(400).json({ success: false, error: 'Invalid action for GET request' });
            }
        }

        if (req.method === 'POST') {
            const { action, id, data } = req.body;

            if (!action) {
                return res.status(400).json({ success: false, error: 'Action parameter is required' });
            }

            switch (action) {
                case 'save':
                    if (!id || data === undefined) {
                        return res.status(400).json({ success: false, error: 'ID and data are required for save action' });
                    }
                    const saveResult = await saveToTextDB(id, data);
                    return res.status(saveResult.success ? 200 : 500).json(saveResult);

                case 'delete':
                    if (!id) {
                        return res.status(400).json({ success: false, error: 'ID parameter is required for delete action' });
                    }
                    const deleteResult = await deleteFromTextDB(id);
                    return res.status(deleteResult.success ? 200 : 500).json(deleteResult);

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
