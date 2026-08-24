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

- 🔗 **Easy Sharing**
  - Generate shareable links for spreadsheets
  - Public read-only access
  - No authentication required for shared sheets

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

## Application Structure & Navigation

### URL Routes

- **`/`** → Login page (index.html)
- **`/home.html`** → Dashboard with all spreadsheets
- **`/editor.html?id=<sheetId>`** → Spreadsheet editor
- **`/shared.html?shared=<shareId>`** → Public shared spreadsheet viewer

### Navigation Flow

```
User visits app → Redirected to login (/)
    ↓
Enter access key → Authenticate
    ↓
Success → Redirect to dashboard (/home.html)
    ↓
Click spreadsheet card → Open editor (/editor.html?id=<sheetId>)
    ↓
Click Share button → Generate link (/shared.html?shared=<shareId>)
```

## Project Structure

```
grids/
├── index.html          # Login page (main entry point)
├── editor.html         # Spreadsheet editor
├── home.html           # User dashboard
├── shared.html         # Public shared spreadsheet viewer
├── styles.css          # Main application styles
├── home.css            # Dashboard styles
├── auth.css            # Login page styles
├── vercel.json         # Vercel deployment configuration
├── manifest.json       # PWA manifest
├── service-worker.js   # PWA service worker
├── config/
│   └── config.js       # Application configuration
├── js/
│   ├── app.js          # Main application (editor page)
│   ├── auth.js         # Authentication manager
│   ├── login-handler.js # Login form handler
│   ├── home.js         # Dashboard functionality
│   ├── shared.js       # Shared spreadsheet viewer
│   ├── spreadsheet.js  # Luckysheet wrapper
│   ├── storage.js      # Data persistence layer
│   ├── themes.js       # Theme management
│   └── pwa.js          # Progressive Web App
├── api/
│   ├── users.js        # Unified authentication & data API
│   └── auth/
│       └── hash.js     # Server-side hashing endpoint
└── icons/              # Application icons
```

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

### Key Features for Deployment

- **Root URL serves login page**: `index.html` is served at `/`
- **API routing**: All `/api/*` requests are proxied correctly
- **Static file serving**: All HTML files, CSS, and JS are served directly
- **No build process required**: Static files are ready for deployment

## Implementation Status

✅ **Fully Implemented:**
- Authentication system with pepper hashing
- Client-side and server-side key hashing
- Session management with sessionStorage
- Theme management (light/dark/system modes)
- Spreadsheet operations via Luckysheet
- Data persistence (localStorage and TextDB)
- Auto-save functionality (every 30 seconds)
- Import/Export (Excel, CSV)
- Undo/Redo operations
- Freeze rows/columns
- Notification system
- Keyboard shortcuts (Ctrl+S to save)
- API endpoints for Vercel deployment
- Public spreadsheet sharing
- PWA support with service worker

### Core JavaScript Modules

- **js/auth.js**: AuthenticationManager class, user lookup, session management
- **js/login-handler.js**: Form handling, loading states, auto-redirect
- **js/home.js**: Dashboard, spreadsheet cards, search, create/delete operations
- **js/app.js**: Editor initialization, auto-save, event handling
- **js/shared.js**: Read-only shared spreadsheet viewer
- **js/storage.js**: Data persistence with localStorage and TextDB
- **js/themes.js**: Theme switching and persistence
- **js/spreadsheet.js**: Luckysheet wrapper and operations

## Keyboard Shortcuts

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
- Icons from SVG libraries
- Fonts from Google Fonts (Inter)

## Support

For issues or questions:
- Review Luckysheet documentation: https://mengshukeji.github.io/LuckysheetDocs/zh/

## Roadmap

Future enhancements:
- [ ] Real-time collaboration
- [ ] More chart types
- [ ] Advanced formulas
- [ ] Mobile app version
- [ ] Enhanced PWA features
- [ ] Export to PDF
- [ ] Custom functions
