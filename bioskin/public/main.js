// public/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const isDev = require('electron-is-dev');
const Database = require('better-sqlite3'); // Import better-sqlite3

let mainWindow;
let db; // Database connection variable

// --- Database Setup ---
function setupDatabase() {
    // Store DB in user data path for persistence across app updates
    const dbDir = path.join(app.getPath('userData'), 'database');
    // Ensure the directory exists
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Created database directory: ${dbDir}`);
    }
    const dbPath = path.join(dbDir, 'inventory.db'); // Name of the database file
    console.log(`Database path: ${dbPath}`);

    try {
        // Create or open the database file
        db = new Database(dbPath, { verbose: console.log }); // verbose logs SQL statements
        console.log('Connected to the SQLite database.');
        initializeSchema(); // Create tables if they don't exist
    } catch (err) {
        console.error("FATAL: Error opening SQLite database", err.message);
        // Consider notifying the user or quitting gracefully
        app.quit();
    }
}

// --- Create Database Schema ---
function initializeSchema() {
    console.log("Initializing database schema...");
    // SQL statement to create the 'items' table if it doesn't exist
    // Matches the fields used in your React components
    const schemaSql = `
        CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT, -- Auto-incrementing integer ID
            name TEXT NOT NULL,                   -- Item name (required)
            sku TEXT UNIQUE,                      -- Stock Keeping Unit (optional, but unique if provided)
            description TEXT,                     -- Item description (optional)
            cost_price REAL DEFAULT 0.0,          -- Cost price (decimal number)
            quantity INTEGER DEFAULT 0,           -- Stock quantity (integer)
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, -- Timestamp when created
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP  -- Timestamp when last updated
        );

        -- Trigger to automatically update the 'updated_at' timestamp on any row update
        DROP TRIGGER IF EXISTS update_item_timestamp; -- Remove old trigger if exists
        CREATE TRIGGER IF NOT EXISTS update_item_timestamp
        AFTER UPDATE ON items
        FOR EACH ROW
        BEGIN
            UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
        END;
    `;
    try {
        // Execute the SQL to create table and trigger
        db.exec(schemaSql);
        console.log("Database schema checked/initialized successfully.");
    } catch (err) {
        console.error("Error initializing schema:", err.message);
        // Handle schema errors (e.g., migration issues in future)
    }
}

// --- Close Database Connection ---
function closeDatabase() {
    if (db) {
        db.close(); // better-sqlite3 close is synchronous
        console.log("Database connection closed.");
    }
}

// --- Electron App Lifecycle ---
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000, // Adjust size as needed
        height: 750,
        webPreferences: {
            // Preload script is the bridge to the renderer process
            preload: path.join(__dirname, 'preload.js'),
            // Security best practices:
            contextIsolation: true, // Keep renderer and preload scripts separate
            nodeIntegration: false, // Prevent Node.js access in renderer
        },
    });

    // Load the React application
    // In development, load from the CRA dev server
    // In production, load the built index.html file
    mainWindow.loadURL(
        isDev
            ? 'http://localhost:3000' // URL of the React dev server
            : `file://${path.join(__dirname, '../build/index.html')}` // Path to the production build
    );

    // Open DevTools automatically in development
    if (isDev) {
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    }
}

// --- App Ready Event ---
app.whenReady().then(() => {
    setupDatabase(); // Initialize the database connection and schema
    createWindow(); // Create the application window

    app.on('activate', function () {
        // Re-create window on macOS dock click if none are open
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// --- App Window Closed Event ---
app.on('window-all-closed', function () {
    closeDatabase(); // Close the database connection gracefully
    // Quit the app on all platforms except macOS
    if (process.platform !== 'darwin') app.quit();
});

// --- IPC Handlers (Backend Logic for Frontend Requests) ---

// Handle request to get all items
ipcMain.handle('db:get-items', () => {
    console.log('IPC Main: Received db:get-items request');
    if (!db) throw new Error("Database not initialized");
    try {
        // Prepare and execute SQL query to select all relevant item fields
        const stmt = db.prepare('SELECT id, name, sku, description, cost_price, quantity FROM items ORDER BY name COLLATE NOCASE');
        const items = stmt.all(); // .all() fetches all rows
        console.log(`IPC Main: Sending ${items.length} items`);
        return items; // Return the array of items to the renderer
    } catch (error) {
        console.error('IPC Main: Error getting items:', error);
        throw error; // Propagate the error back to the renderer
    }
});

// Handle request to add a new item
ipcMain.handle('db:add-item', (event, itemData) => {
    console.log('IPC Main: Received db:add-item request with data:', itemData);
    if (!db) throw new Error("Database not initialized");
    try {
        // Basic validation
        if (!itemData || !itemData.name || itemData.name.trim() === '') {
            throw new Error("Item name is required.");
        }
        // Prepare SQL statement for insertion with named parameters
        const stmt = db.prepare(
            'INSERT INTO items (name, sku, description, cost_price, quantity) VALUES (@name, @sku, @description, @cost_price, @quantity)'
        );
        // Execute the statement with data from the renderer
        const result = stmt.run({
            name: itemData.name.trim(),
            sku: itemData.sku || null, // Use null if SKU is empty/not provided
            description: itemData.description || null,
            cost_price: itemData.cost_price || 0.0,
            quantity: itemData.quantity || 0
        });
        console.log(`IPC Main: Added item with ID ${result.lastInsertRowid}. Changes: ${result.changes}`);
        // Return success and the ID of the newly inserted item
        return { success: true, id: result.lastInsertRowid };
    } catch (error) {
        console.error('IPC Main: Error adding item:', error);
        // Handle specific database errors, like UNIQUE constraint violation for SKU
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
             throw new Error(`SKU "${itemData.sku}" already exists. Please use a unique SKU.`);
        }
        throw error; // Propagate other errors
    }
});

// Handle request to update an existing item
ipcMain.handle('db:update-item', (event, itemData) => {
    console.log('IPC Main: Received db:update-item request with data:', itemData);
    if (!db) throw new Error("Database not initialized");
    try {
        // Basic validation
        if (!itemData || !itemData.id || !itemData.name || itemData.name.trim() === '') {
            throw new Error("Item ID and Name are required for update.");
        }
        // Prepare SQL statement for update
        const stmt = db.prepare(
            'UPDATE items SET name = @name, sku = @sku, description = @description, cost_price = @cost_price, quantity = @quantity WHERE id = @id'
        );
        // Execute the update
        const result = stmt.run({
            id: itemData.id, // ID of the item to update
            name: itemData.name.trim(),
            sku: itemData.sku || null,
            description: itemData.description || null,
            cost_price: itemData.cost_price || 0.0,
            quantity: itemData.quantity || 0
        });

        // Check if any row was actually updated
        if (result.changes === 0) {
            // Verify if the item ID exists at all
            const checkStmt = db.prepare('SELECT 1 FROM items WHERE id = ?');
            const exists = checkStmt.get(itemData.id);
            if (!exists) {
                 // Throw error if trying to update a non-existent item
                 throw new Error(`Item with ID ${itemData.id} not found for update.`);
            } else {
                 // Item exists but data was identical, no changes made
                 console.log(`IPC Main: Item ${itemData.id} data was unchanged.`);
                 return { success: true, unchanged: true }; // Indicate success but no change
            }
        } else {
            console.log(`IPC Main: Updated item with ID ${itemData.id}. Changes: ${result.changes}`);
        }
        return { success: true }; // Return success
    } catch (error) {
        console.error('IPC Main: Error updating item:', error);
         // Handle specific errors like UNIQUE constraint violation for SKU
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
             throw new Error(`SKU "${itemData.sku}" already exists. Please use a unique SKU.`);
        }
        throw error; // Propagate other errors
    }
});

// Handle request to delete an item
ipcMain.handle('db:delete-item', (event, itemId) => {
    console.log(`IPC Main: Received db:delete-item request for ID: ${itemId}`);
    if (!db) throw new Error("Database not initialized");
    try {
        // Basic validation
        if (!itemId) {
            throw new Error("Item ID is required to delete.");
        }
        // Prepare and execute SQL statement for deletion
        const stmt = db.prepare('DELETE FROM items WHERE id = ?');
        const result = stmt.run(itemId); // Execute with the item ID

        // Check if a row was actually deleted
        if (result.changes === 0) {
            console.warn(`IPC Main: Attempted to delete item ID ${itemId}, but it was not found.`);
            // Depending on requirements, you might throw an error or just return success=false
            // For simplicity, we'll return success=true as the item is effectively gone.
        } else {
            console.log(`IPC Main: Deleted item with ID ${itemId}. Changes: ${result.changes}`);
        }
        return { success: true }; // Return success
    } catch (error) {
        console.error('IPC Main: Error deleting item:', error);
        throw error; // Propagate the error
    }
});