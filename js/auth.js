/**
 * ================================================
 * GRIDS - Authentication Module
 * ================================================
 *
 * Handles user authentication with access keys:
 * - Login with existing keys
 * - Auto-create account for new keys
 * - Session management
 * - Secure storage of hashed keys
 *
 * SECURITY NOTES:
 * - Raw keys are NEVER stored
 * - Only pepper-hashed keys are stored
 * - Session tokens are used for authenticated sessions
 * - Keys are hashed client-side before any API calls
 */

// ================================================
// Configuration
// ================================================

const AUTH_CONFIG = {
    // Storage keys
    storageKeys: {
        users: 'grids_users',
        sessions: 'grids_sessions',
        currentUser: 'grids_current_user',
    },

    // Session duration (30 days)
    sessionDuration: 30 * 24 * 60 * 60 * 1000,

    // API endpoints (for when backend is implemented)
    apiEndpoints: {
        login: '/api/auth/login',
        register: '/api/auth/register',
        verify: '/api/auth/verify',
        logout: '/api/auth/logout',
    },
};

// ================================================
// Authentication Manager Class
// ================================================

class AuthenticationManager {
    constructor() {
        this.currentUser = null;
        this.sessionToken = null;
        this.isProduction = APP_CONFIG.isProduction;
        this.initialize();
    }

    /**
     * Initialize authentication manager
     * Loads existing session if available
     */
    async initialize() {
        // Load existing session from storage
        const storedSession = this.loadSession();

        if (storedSession && this.isSessionValid(storedSession)) {
            this.currentUser = storedSession.user;
            this.sessionToken = storedSession.token;
            // Redirect to main app if on login page
            if (window.location.pathname === '/auth.html' || window.location.pathname.endsWith('auth.html')) {
                window.location.href = '/index.html';
            }   
        }
    }

    /**
     * Authenticate user with access key
     * - Logs in if key exists
     * - Creates account if key doesn't exist
     *
     * @param {string} rawKey - Raw access key from user
     * @returns {Promise<Object>} Authentication result
     */
    async authenticate(rawKey) {
        try {
            // Validate key format
            const validation = window.validateAccessKey(rawKey);
            if (!validation.isValid) {
                return {
                    success: false,
                    error: validation.message,
                };
            }

            // Hash the access key
            const hashedKey = await window.hashAccessKey(rawKey);

            // Check if user exists
            const existingUser = await this.findUserByHashedKey(hashedKey);

            if (existingUser) {
                // Login existing user
                return await this.loginUser(rawKey, hashedKey, existingUser);
            } else {
                // Create new account
                return await this.createUser(rawKey, hashedKey);
            }
        } catch (error) {
            console.error('Authentication error:', error);
            return {
                success: false,
                error: 'Authentication failed. Please try again.',
            };
        }
    }

    /**
     * Login existing user
     *
     * @param {string} rawKey - Raw access key
     * @param {string} hashedKey - Hashed access key
     * @param {Object} user - User object
     * @returns {Promise<Object>} Login result
     */
    async loginUser(rawKey, hashedKey, user) {
        // Implement login logic
        try {
            // Verify key matches
            const isValid = await window.verifyAccessKey(rawKey, user.hashedKey);

            if (!isValid) {
                return {
                    success: false,
                    error: 'Invalid access key',
                };
            }

            // Generate session token
            const sessionToken = await window.generateSessionToken(hashedKey);

            // Create session
            const session = {
                token: sessionToken,
                userId: user.id,
                createdAt: Date.now(),
                expiresAt: Date.now() + AUTH_CONFIG.sessionDuration,
            };

            // Save session
            this.saveSession(session, user);

            // Update current user
            this.currentUser = user;
            this.sessionToken = sessionToken;

            return {
                success: true,
                user: user,
                isNewUser: false,
                message: 'Welcome back!',
            };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                error: 'Login failed. Please try again.',
            };
        }
    }

    /**
     * Create new user account
     *
     * @param {string} rawKey - Raw access key
     * @param {string} hashedKey - Hashed access key
     * @returns {Promise<Object>} Registration result
     */
    async createUser(rawKey, hashedKey) {
        // Implement user creation
        try {
            // Generate unique user ID
            const userId = this.generateUserId();

            // Create user object (NEVER store raw key!)
            const user = {
                id: userId,
                hashedKey: hashedKey, // Only store hashed key
                createdAt: Date.now(),
                lastLogin: Date.now(),
                // Add other user properties as needed
                settings: {
                    theme: APP_CONFIG.themes.default,
                },
            };

            // Save user to storage
            await this.saveUser(user);

            // Generate session token
            const sessionToken = await window.generateSessionToken(hashedKey);

            // Create session
            const session = {
                token: sessionToken,
                userId: userId,
                createdAt: Date.now(),
                expiresAt: Date.now() + AUTH_CONFIG.sessionDuration,
            };

            // Save session
            this.saveSession(session, user);

            // Update current user
            this.currentUser = user;
            this.sessionToken = sessionToken;

            return {
                success: true,
                user: user,
                isNewUser: true,
                message: 'Account created successfully!',
            };
        } catch (error) {
            console.error('User creation error:', error);
            return {
                success: false,
                error: 'Failed to create account. Please try again.',
            };
        }
    }

    /**
     * Logout current user
     *
     * @returns {Promise<Object>} Logout result
     */
    async logout() {
        // Implement logout
        try {
            // Clear session
            this.clearSession();

            // Reset current user
            this.currentUser = null;
            this.sessionToken = null;

            // Clear any app data associated with session
            const keysToRemove = [
                APP_CONFIG.storage.keys.spreadsheetData,
                APP_CONFIG.storage.keys.recentFiles,
                APP_CONFIG.storage.keys.userSettings,
            ];
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Redirect to login page
            if (window.location.pathname !== '/auth.html') {
                window.location.href = '/auth.html';
            }

            return {
                success: true,
                message: 'Logged out successfully',
            };
        } catch (error) {
            console.error('Logout error:', error);
            return {
                success: false,
                error: 'Logout failed',
            };
        }
    }

    /**
     * Check if user is authenticated
     *
     * @returns {boolean} Authentication status
     */
    isAuthenticated() {
        return this.currentUser !== null && this.sessionToken !== null;
    }

    /**
     * Get current user
     *
     * @returns {Object|null} Current user object
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Get session token
     *
     * @returns {string|null} Session token
     */
    getSessionToken() {
        return this.sessionToken;
    }

    // ================================================
    // Private Methods (Storage Operations)
    // ================================================

    /**
     * Find user by hashed key
     * Implement user lookup
     *
     * @param {string} hashedKey - Hashed access key
     * @returns {Promise<Object|null>} User object or null
     */
    async findUserByHashedKey(hashedKey) {
        // Implement user lookup from storage
        // For production: make API call to backend
        // For development: check localStorage

        if (this.isProduction) {
            // Implement production user lookup
            // const response = await fetch(`${AUTH_CONFIG.apiEndpoints.verify}`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${this.sessionToken}`
            //     },
            //     body: JSON.stringify({ hashedKey })
            // });
            // const data = await response.json();
            // return data.user;
        } else {
            // Development: localStorage lookup
            const users = this.loadUsers();
            return users.find(user => user.hashedKey === hashedKey) || null;
        }

        return null;
    }

    /**
     * Save user to storage
     * Implement user storage
     *
     * @param {Object} user - User object
     */
    async saveUser(user) {
        // Implement user storage
        if (this.isProduction) {
            // Implement production user storage
            // const response = await fetch(AUTH_CONFIG.apiEndpoints.register, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ user })
            // });
        } else {
            // Development: localStorage storage
            const users = this.loadUsers();
            users.push(user);
            localStorage.setItem(AUTH_CONFIG.storageKeys.users, JSON.stringify(users));
        }
    }

    /**
     * Load users from storage
     * Implement user loading
     *
     * @returns {Array} Array of user objects
     */
    loadUsers() {
        try {
            const usersJson = localStorage.getItem(AUTH_CONFIG.storageKeys.users);
            return usersJson ? JSON.parse(usersJson) : [];
        } catch (error) {
            console.error('Error loading users:', error);
            return [];
        }
    }

    /**
     * Save session to storage
     * Implement session storage
     *
     * @param {Object} session - Session object
     * @param {Object} user - User object
     */
    saveSession(session, user) {
        try {
            const sessionData = {
                token: session.token,
                userId: session.userId,
                createdAt: session.createdAt,
                expiresAt: session.expiresAt,
                user: user,
            };

            localStorage.setItem(
                AUTH_CONFIG.storageKeys.sessions,
                JSON.stringify(sessionData)
            );
            localStorage.setItem(
                AUTH_CONFIG.storageKeys.currentUser,
                JSON.stringify(user)
            );
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    /**
     * Load session from storage
     * Implement session loading
     *
     * @returns {Object|null} Session object or null
     */
    loadSession() {
        try {
            const sessionJson = localStorage.getItem(AUTH_CONFIG.storageKeys.sessions);
            return sessionJson ? JSON.parse(sessionJson) : null;
        } catch (error) {
            console.error('Error loading session:', error);
            return null;
        }
    }

    /**
     * Clear session from storage
     */
    clearSession() {
        try {
            localStorage.removeItem(AUTH_CONFIG.storageKeys.sessions);
            localStorage.removeItem(AUTH_CONFIG.storageKeys.currentUser);
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }

    /**
     * Check if session is valid
     *
     * @param {Object} session - Session object
     * @returns {boolean} Validity status
     */
    isSessionValid(session) {
        if (!session || !session.expiresAt) {
            return false;
        }
        return Date.now() < session.expiresAt;
    }

    /**
     * Generate unique user ID
     * Implement ID generation
     *
     * @returns {string} Unique user ID
     */
    generateUserId() {
        return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// ================================================
// Initialize Authentication Manager
// ================================================

// Create global authentication instance
// This will be initialized when the DOM is ready
const authManager = new AuthenticationManager();

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.AuthenticationManager = AuthenticationManager;
    window.authManager = authManager;
}
