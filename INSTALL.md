# Installation Guide - Foosball Tournament Manager

Complete step-by-step installation guide for the Foosball Tournament Manager application.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0.0 or higher)
  - Check version: `node --version`
  - Download from: https://nodejs.org/
- **npm** (comes with Node.js)
  - Check version: `npm --version`
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A terminal/command prompt

## Installation Steps

### Step 1: Navigate to the Project Directory

```bash
cd maxfoos
```

### Step 2: Install Frontend Dependencies

Install all required dependencies for the React frontend:

```bash
npm install
```

This will install:
- React 19.2.0
- React DOM 19.2.0
- React Router DOM 6.22.0
- Vite 7.2.4
- TypeScript and all development dependencies

**Expected output:**
```
added XXX packages in XXs
```

### Step 3: Install Backend Dependencies

Navigate to the backend directory and install its dependencies:

```bash
cd backend
npm install
```

This will install:
- Express 4.18.2
- CORS 2.8.5

**Expected output:**
```
added XX packages in Xs
```

### Step 4: Return to Project Root

```bash
cd ..
```

You should now be in the `maxfoos` directory.

## Starting the Application

You need to run **TWO separate processes** - one for the backend and one for the frontend.

### Option A: Using Two Terminal Windows (Recommended)

**Terminal 1 - Backend Server:**
```bash
cd maxfoos/backend
npm start
```

**Expected output:**
```
Server running on http://localhost:3001
```

**Terminal 2 - Frontend Development Server:**
```bash
cd maxfoos
npm run dev
```

**Expected output:**
```
  VITE v7.2.4  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Option B: Using npm Scripts

From the `maxfoos` directory:

**Terminal 1 - Backend:**
```bash
npm run backend
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Verification

### 1. Check Backend is Running

Open your browser and visit: `http://localhost:3001/api/players`

You should see a JSON response:
```json
["Alice","Bob","Charlie","Dave","Eve","Frank","Grace"]
```

### 2. Check Frontend is Running

Open your browser and visit: `http://localhost:5173`

You should see:
- The Foosball Tournament home page
- A navigation bar with "Home" and "Admin" links
- A player standings table (initially empty)
- Sections for recent games and unplayed games

### 3. Test Admin Access

1. Click "Admin" in the navigation bar
2. Enter password: `admin123`
3. You should see the admin panel with a form to add games

## Troubleshooting

### Error: "Port 3001 is already in use"

**Solution 1 - Kill the process using port 3001:**

**macOS/Linux:**
```bash
lsof -ti:3001 | xargs kill -9
```

**Windows (Command Prompt):**
```cmd
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F
```

**Windows (PowerShell):**
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process
```

**Solution 2 - Change the backend port:**

Edit `backend/src/server.js` line 10:
```javascript
const PORT = 3002; // or any other available port
```

Then update `src/services/api.ts` line 1:
```typescript
const API_BASE_URL = 'http://localhost:3002/api';
```

### Error: "Cannot find module 'react-router-dom'"

This means the dependencies weren't installed properly.

**Solution:**
```bash
cd maxfoos
rm -rf node_modules package-lock.json
npm install
```

### Error: "Cannot find module 'express'"

The backend dependencies weren't installed.

**Solution:**
```bash
cd maxfoos/backend
rm -rf node_modules package-lock.json
npm install
```

### Error: "Failed to fetch" in the browser

The frontend can't connect to the backend.

**Checklist:**
1. Is the backend running? Check Terminal 1 for errors
2. Is it running on port 3001? Visit `http://localhost:3001/api/players`
3. Check browser console (F12) for specific error messages
4. Ensure CORS is enabled (it should be by default)

### Frontend shows blank page

**Solution 1 - Clear browser cache:**
- Press Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

**Solution 2 - Check browser console:**
- Press F12 to open developer tools
- Look for errors in the Console tab
- Common issues: JavaScript errors, missing dependencies

**Solution 3 - Restart the frontend server:**
```bash
# Press Ctrl+C to stop the server, then:
npm run dev
```

### TypeScript Errors

If you see TypeScript compilation errors:

```bash
# Clear the TypeScript cache
rm -rf node_modules/.vite
npm run dev
```

### Permission Errors

If you get permission errors when creating `data.json`:

**macOS/Linux:**
```bash
chmod 755 backend
chmod 644 backend/data.json  # if the file exists
```

**Windows:**
- Right-click the `backend` folder
- Properties → Security → Edit
- Ensure your user has "Write" permissions

## Development Commands

### Frontend Commands (from `maxfoos` directory)

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend Commands (from `maxfoos/backend` directory)

```bash
npm start            # Start server
npm run dev          # Start with auto-restart (Node 18+)
```

## Post-Installation Configuration

### Changing Player Names

Edit `backend/src/server.js` line 22:
```javascript
players: ['Your', 'Player', 'Names', 'Here', 'Seven', 'Total', 'Players']
```

Restart the backend server for changes to take effect.

### Changing Admin Password

Edit `backend/src/server.js` line 24:
```javascript
adminPassword: 'your_secure_password'
```

Restart the backend server for changes to take effect.

### Resetting All Data

Delete the data file and restart the backend:

```bash
rm backend/data.json
cd backend
npm start
```

A fresh `data.json` will be created with no games.

## Production Deployment

For production deployment, see the main README.md file for:
- Building the frontend for production
- Setting up a production database
- Configuring environment variables
- Deploying to cloud platforms

## Getting Help

If you encounter issues not covered here:

1. Check the main README.md for additional information
2. Check the SETUP.md for quick start instructions
3. Review the browser console (F12) for error messages
4. Review the backend terminal for server errors
5. Ensure all prerequisites are met (Node.js version, etc.)

## Success Checklist

- [ ] Node.js 18+ installed
- [ ] Frontend dependencies installed (`node_modules` exists in `maxfoos/`)
- [ ] Backend dependencies installed (`node_modules` exists in `maxfoos/backend/`)
- [ ] Backend running on port 3001
- [ ] Frontend running on port 5173 (or another port)
- [ ] Can access home page in browser
- [ ] Can login to admin panel with `admin123`
- [ ] Can add a test game
- [ ] Player standings update correctly

If all items are checked, you're ready to start your tournament! 🎉

## Next Steps

After successful installation:

1. Review SETUP.md for usage instructions
2. Add your first game in the admin panel
3. Check the standings update correctly
4. Customize player names if needed
5. Start your tournament!

Enjoy managing your foosball tournament! 🏆