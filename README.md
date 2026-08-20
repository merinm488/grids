# Grids - Modern Spreadsheet Application

A modern, responsive spreadsheet application built with Luckysheet, featuring Excel-like functionality with beautiful dark and light themes.

## Features

- 🔐 **Key-Based Authentication**
  - Secure access key login system
  - Auto-account creation for new keys
  - Pepper hashing for enhanced security
  - Session management with 30-day expiry
  - Modern, responsive login interface

- 📊 **Full Spreadsheet Functionality**
  - Number calculations and formulas (=A1+B1, =SUM(), =AVERAGE(), etc.)
  - Multiple sheets support
  - Cell formatting (bold, italic, colors, borders)
  - Charts and visualizations
  - Import/Export (Excel, CSV)
  - Undo/Redo operations
  - Freeze rows and columns

- 🎨 **Beautiful Themes**
  - **Light Theme**: White primary with green accents
  - **Dark Theme**: Black primary with green accents
  - Smooth theme transitions
  - System theme detection support

- 💾 **Smart Storage**
  - Local storage for development/testing
  - TextDB integration for production (https://textdb.dev/api/data/)
  - Auto-save functionality
  - User-specific data storage
  - URL-based spreadsheet sharing

- 📱 **Fully Responsive**
  - Works on desktop, tablet, and mobile devices
  - Touch-friendly interface
  - Adaptive layout for all screen sizes


## Authentication System

### Overview

The application uses a key-based authentication system:

1. **Access Key Entry**: Users enter any key of their choice (no format restrictions)
2. **Automatic Account Creation**: If the key doesn't exist, a new account is created automatically
3. **Secure Storage**: Keys are never stored in plain text - only pepper-hashed versions are stored
4. **Session Management**: Sessions last for 30 days and are stored locally

### Security Implementation

The hashing process uses **pepper hashing** for enhanced security:

```
1. rawKey → SHA-256 → initialHash
2. pepperName + ":" + initialHash → pepperedInput  
3. pepperedInput → SHA-256 → finalHash
4. finalHash → Base64 → storedKey
```



### Authentication Files

- **auth.html**: Login page with modern UI
- **auth.css**: Styling for login interface
- **js/crypto-utils.js**: Secure hashing utilities
- **js/auth.js**: Authentication manager
- **js/login-handler.js**: Login UI interactions

### Key Features

- ✅ No format restrictions on access keys (only checks if empty)
- ✅ Automatic account creation for new keys
- ✅ Session persistence across browser sessions
- ✅ Auto-redirect to login if not authenticated
- ✅ Secure client-side hashing (development mode)
- ✅ Ready for server-side implementation (production)

## Project Structure

```
grids/
├── index.html          # Main HTML file with auth check
├── auth.html           # Login page
├── auth.css            # Login page styles
├── styles.css          # Application styles with theme variables
├── vercel.json         # Vercel deployment configuration
├── config/
│   └── config.js       # Application configuration
├── js/
│   ├── app.js          # Main application entry point ✅
│   ├── auth.js         # Authentication manager ✅
│   ├── crypto-utils.js # Cryptographic utilities ✅
│   ├── login-handler.js # Login UI handler ✅
│   ├── spreadsheet.js  # Spreadsheet operations ✅
│   ├── storage.js      # Data persistence layer ✅
│   └── themes.js       # Theme management ✅
├── api/
│   ├── auth/
│   │   └── hash.js     # Server-side hashing endpoint ✅
│   └── storage.js      # TextDB API endpoint ✅
└── README.md           # This file
```

## Implementation Status

✅ **Fully Implemented:**
- Authentication system with pepper hashing
- Client-side and server-side key hashing
- Session management with 30-day expiry
- Theme management (light/dark modes)
- Spreadsheet operations via Luckysheet
- Data persistence (localStorage and TextDB)
- Auto-save functionality
- Import/Export (Excel, CSV)
- Undo/Redo operations
- Freeze rows/columns
- Notification system
- Keyboard shortcuts
- API endpoints for Vercel deployment

### js/crypto-utils.js
- ✅ HashAccessKey function
- ✅ verifyAccessKey function
- ✅ generateSessionToken function
- ✅ Client-side hashing for development
- ✅ Server-side hashing via API for production

### js/auth.js
- ✅ AuthenticationManager class structure
- ✅ User lookup and storage (localStorage for dev)
- ✅ Session management
- ✅ Login/logout functionality
- ✅ Auto-redirect on authentication

### js/login-handler.js
- ✅ Complete form handling
- ✅ Loading states and messages
- ✅ Auto-redirect on success

### config/config.js
- ✅ Environment detection
- ✅ Storage configuration
- ✅ Spreadsheet options
- ✅ API endpoints

### js/storage.js
- ✅ Local storage operations for development
- ✅ TextDB API integration for production
- ✅ User-specific data storage
- ✅ Data validation and compression

### js/themes.js
- ✅ Theme initialization and switching
- ✅ LocalStorage theme persistence
- ✅ Luckysheet theme overrides
- ✅ System theme detection support

### js/spreadsheet.js
- ✅ Luckysheet initialization
- ✅ Data operations (load, save, export)
- ✅ Sheet management
- ✅ Formula execution
- ✅ Chart operations
- ✅ Import/Export functionality
- ✅ Undo/Redo operations
- ✅ Freeze rows/columns

### js/app.js
- ✅ Application initialization with auth check
- ✅ Event handling
- ✅ Auto-save functionality
- ✅ URL handling
- ✅ Unsaved changes detection
- ✅ Logout functionality
- ✅ Notification system
- ✅ Keyboard shortcuts

### API Endpoints (api/)
- ✅ /api/auth/hash - Server-side key hashing
- ✅ /api/storage - TextDB storage operations

## Keyboard Shortcuts

When implemented:
- `Ctrl+S` / `Cmd+S`: Save spreadsheet
- `Ctrl+Z` / `Cmd+Z`: Undo
- `Ctrl+Y` / `Cmd+Y` or `Cmd+Shift+Z`: Redo

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)


## Contributing

This is a personal project. Feel free to fork and customize!

## License

MIT License - feel free to use this for your own projects.

## Credits

- Built with [Luckysheet](https://github.com/mengshukeji/Luckysheet) - An excellent spreadsheet library
- Icons from various open-source icon libraries
- Fonts from system font stacks

## Support

For issues or questions:
- Review Luckysheet documentation: https://mengshukeji.github.io/LuckysheetDocs/zh/

## Roadmap

Future enhancements (when JavaScript is implemented):
- [ ] Real-time collaboration
- [ ] More chart types
- [ ] Advanced formulas
- [ ] Mobile app version
- [ ] Offline support with PWA
- [ ] Export to PDF
- [ ] Custom functions
