const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Import the API handler
const usersHandler = require('./api/users.js');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Set environment for development
process.env.NODE_ENV = 'development';

// Serve static files from the root directory
app.use(express.static(__dirname));

// Mock request/response for the API handler
function createMockRequest(method, query, body) {
  const req = {
    method,
    query: query || {},
    body: body || {},
    headers: {}
  };
  return req;
}

function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    json(data) {
      this.body = JSON.stringify(data);
      this.headers['Content-Type'] = 'application/json';
      return Promise.resolve(this);
    },
    end(data) {
      if (data) this.body = data;
      return Promise.resolve(this);
    }
  };
  return res;
}

// API endpoint for users
app.all('/api/users', async (req, res) => {
  try {
    console.log(`[LOCAL DEV] ${req.method} /api/users`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Create mock request/response for the API handler
    const mockReq = createMockRequest(req.method, req.query, req.body);
    const mockRes = createMockResponse();

    // Call the API handler
    await usersHandler(mockReq, mockRes);

    // Send the response
    if (mockRes.body) {
      res.status(mockRes.statusCode).send(JSON.parse(mockRes.body));
    } else {
      res.status(mockRes.statusCode).end();
    }
  } catch (error) {
    console.error('[LOCAL DEV] API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// API endpoint for users with query parameters
app.get('/api/users', async (req, res) => {
  try {
    console.log(`[LOCAL DEV] GET /api/users ${JSON.stringify(req.query)}`);

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Create mock request/response for the API handler
    const mockReq = createMockRequest('GET', req.query, {});
    const mockRes = createMockResponse();

    // Call the API handler
    await usersHandler(mockReq, mockRes);

    // Send the response
    if (mockRes.body) {
      res.status(mockRes.statusCode).send(JSON.parse(mockRes.body));
    } else {
      res.status(mockRes.statusCode).end();
    }
  } catch (error) {
    console.error('[LOCAL DEV] API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Fallback for SPA routing - serves login page
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Grids Development Server`);
  console.log(`📝 App: http://localhost:${PORT}`);
  console.log(`🔌 API: http://localhost:${PORT}/api/users`);
  console.log(`\nPress Ctrl+C to stop\n`);
});

module.exports = app;