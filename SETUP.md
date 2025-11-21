### Step 1: Install Dependencies

Open two terminal windows.

**Terminal 1 - Frontend:**
```bash
cd maxfoos
npm install
```

**Terminal 2 - Backend:**
```bash
cd maxfoos/backend
npm install
```

### Step 2: Start the Servers

**Terminal 1 - Start Backend:**
```bash
cd maxfoos/backend
npm start
```

**Terminal 2 - Start Frontend:**
```bash
cd maxfoos
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Step 3: Open the App

1. Open your browser and go to: **http://localhost:5173**
2. You should see the home page with player standings and games

### Step 4: Access Admin Panel

1. Click "Admin" in the navigation bar
2. Enter password: `admin123`
3. You can now add and delete games!
