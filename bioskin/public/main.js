// public/main.js
   const { app, BrowserWindow, ipcMain, Menu, nativeImage } = require('electron');
   const path = require('path');
   const fs = require('fs');
   const isDev = require('electron-is-dev');
   const Database = require('better-sqlite3'); // Import better-sqlite3
   const bcrypt = require('bcrypt');
   const XLSX = require('xlsx');

   // Path to users file (adjust if needed)
   // Use app.getAppPath() for reliability, especially after packaging
   const usersFilePath = path.join(app.getAppPath(), 'users.json');

   // Variable to hold the currently logged-in user's info (simple session)
   let currentUser = null;

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

   function initializeSchema() {
       console.log("Initializing database schema...");

       // SQL statement to create the 'items' table if it doesn't exist
       const itemsTableSql = `
           CREATE TABLE IF NOT EXISTS items (
               id INTEGER PRIMARY KEY AUTOINCREMENT,
               name TEXT NOT NULL,
               sku TEXT UNIQUE,
               description TEXT,
               cost_price REAL DEFAULT 0.0,
               quantity INTEGER DEFAULT 0,
               category TEXT,                      -- NEW: For product category
               storage_location TEXT,              -- NEW: For storage location
               variant TEXT,                       -- NEW: For product variant (e.g., size, color)
               status TEXT,                        -- NEW: For stock status (e.g., 'High', 'Normal', 'Low')
               created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Changed to DATETIME for clarity
               updated_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- Changed to DATETIME for clarity
           );
       `;

       // Trigger to automatically update the 'updated_at' timestamp on any row update
       // No need to drop and recreate if using "IF NOT EXISTS" for the trigger itself.
       const updateTimestampTriggerSql = `
           CREATE TRIGGER IF NOT EXISTS update_items_updated_at_trigger -- Renamed for clarity
           AFTER UPDATE ON items
           FOR EACH ROW
           WHEN OLD.updated_at = NEW.updated_at OR OLD.updated_at IS NULL -- Only update if not already set by the UPDATE statement
           BEGIN
               UPDATE items SET updated_at = CURRENT_TIMESTAMP WHERE id = OLD.id;
           END;
       `;
       // Note: A more common pattern for updated_at is to set it directly in your UPDATE SQL.
       // The trigger is a fallback or can be used if you want it to always reflect DB write time.
       // If you manually set updated_at in your 'update-item' IPC handler, this trigger might be redundant
       // or you might adjust its WHEN clause. For now, this is a common setup.

       try {
           db.exec(itemsTableSql);
           console.log("Items table schema checked/initialized successfully.");

           db.exec(updateTimestampTriggerSql);
           console.log("Update timestamp trigger checked/initialized successfully.");

           // --- Handle adding new columns to an EXISTING table if needed ---
           // This is more for development. In production, you'd use proper migration scripts.
           // Check if columns exist and add them if they don't.
           const columnsToAdd = [
               { name: 'category', type: 'TEXT' },
               { name: 'storage_location', type: 'TEXT' },
               { name: 'variant', type: 'TEXT' },
               { name: 'status', type: 'TEXT' }
           ];

           const tableInfo = db.prepare(`PRAGMA table_info(items);`).all();
           const existingColumns = tableInfo.map(col => col.name);

           for (const column of columnsToAdd) {
               if (!existingColumns.includes(column.name)) {
                   try {
                       db.exec(`ALTER TABLE items ADD COLUMN ${column.name} ${column.type};`);
                       console.log(`Successfully added column: ${column.name} to items table.`);
                   } catch (alterError) {
                       console.error(`Error adding column ${column.name}:`, alterError.message);
                   }
               }
           }
           // --- End of ALTER TABLE logic ---

       } catch (err) {
           console.error("Error initializing schema:", err.message);
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
       // ---> SECTION TO SET UP THE ICON <---
       const iconPath = path.join(__dirname, 'logo.png'); // Path to your icon in the 'public' folder
       let windowIcon = null;

       if (fs.existsSync(iconPath)) {
           windowIcon = nativeImage.createFromPath(iconPath);
           console.log(`Window icon loaded from: ${iconPath}`);
       } else {
           console.warn(`Window icon NOT FOUND at: ${iconPath}. Using default Electron icon.`);
       }
       // ---> END OF ICON SETUP SECTION <---

       mainWindow = new BrowserWindow({
           width: 1200,
           height: 800,
           title: "Bioskin Inventory Management System",
           icon: windowIcon,
           webPreferences: {
               preload: path.join(__dirname, 'preload.js'), // Assumes preload.js is in public/
               contextIsolation: true,
               nodeIntegration: false,
           },
       });

       Menu.setApplicationMenu(null);

       const startUrl = isDev
           ? 'http://localhost:3000'
           : `file://${path.join(__dirname, '../build/index.html')}`; // For production
       mainWindow.loadURL(startUrl);

       mainWindow.webContents.on('did-finish-load', () => {
           // mainWindow.setTitle('Bioskin Inventory Management System');
       });

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
   ipcMain.handle('db:get-items', (event, filters = {}) => {
       console.log('[IPC Main]: Received db:get-items request with filters:', JSON.stringify(filters, null, 2)); // Enhanced log
       if (!db) {
           console.error("[IPC Main] db:get-items: Database not initialized!");
           throw new Error("Database not initialized");
       }

       let sql = `SELECT id, name, sku, description, cost_price, quantity, category, storage_location, variant, status, created_at, updated_at
                  FROM items`;
       const queryParams = {}; // Use an object for named parameters

       const whereClauses = [];

       if (filters.category && filters.category.trim() !== '') {
           whereClauses.push("LOWER(category) = LOWER(@category)");
           queryParams.category = filters.category.trim();
       }
       if (filters.storageLocation && filters.storageLocation.trim() !== '') { // Key from frontend is 'storageLocation'
           whereClauses.push("LOWER(storage_location) = LOWER(@storage_location)");
           queryParams.storage_location = filters.storageLocation.trim();
       }
       if (filters.searchTerm && filters.searchTerm.trim() !== '') {
           whereClauses.push("(LOWER(name) LIKE LOWER(@searchTerm) OR LOWER(sku) LIKE LOWER(@searchTerm))");
           queryParams.searchTerm = `%${filters.searchTerm.trim()}%`;
       }

       if (whereClauses.length > 0) {
           sql += " WHERE " + whereClauses.join(" AND ");
       }
       sql += " ORDER BY name COLLATE NOCASE ASC";

       try {
           const stmt = db.prepare(sql);
           // Pass queryParams directly to .all() if it contains properties, otherwise call without args
           const items = Object.keys(queryParams).length > 0 ? stmt.all(queryParams) : stmt.all();

           console.log(`[IPC Main] db:get-items: Executed SQL: ${sql}`);
           console.log(`[IPC Main] db:get-items: With Params: ${JSON.stringify(queryParams, null, 2)}`);
           console.log(`[IPC Main] db:get-items: Sending ${items.length} items`);
           return items;
       } catch (error) {
           console.error('[IPC Main] db:get-items: Error getting items:', error.message, error.stack);
           throw error; // Propagate the error
       }
   });

   ipcMain.handle('get-item-by-id', async (event, id) => { // Keep async if preload uses invoke
       console.log(`Main Process: Received request for item with ID: ${id}`);
       if (!id && id !== 0) { // Check for null, undefined, empty string, but allow 0 if it's a valid ID
           console.error('Main Process: getItemById called without a valid ID.');
           // Throwing an error is better as the frontend `ProductFormPage` has a try/catch
           throw new Error('No ID provided to getItemById');
       }
       try {
           // SELECT the new columns
           const stmt = db.prepare(
               `SELECT id, name, sku, description, cost_price, quantity, category, storage_location, variant, status, created_at, updated_at
                FROM items WHERE id = ?`
           );
           const item = stmt.get(id); // better-sqlite3 get is synchronous

           if (item) {
               console.log('Main Process: Found item:', item);
               return item; // Return the item object directly
           } else {
               console.log(`Main Process: Item with ID ${id} not found.`);
               return null; // Return null if not found, frontend ProductFormPage handles this
           }
       } catch (error) {
           console.error(`Main Process: Error fetching item by ID ${id}:`, error);
           throw new Error(`Failed to retrieve item: ${error.message}`);
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
           // ADD VALIDATION for category and storage_location if they are mandatory
           if (!itemData.category) {
               throw new Error("Item category is required.");
           }
           if (!itemData.storage_location) { // Frontend sends storage_location
               throw new Error("Item storage location is required.");
           }


           // Prepare SQL statement for insertion with named parameters
           // ADD category, storage_location, variant, status
           const stmt = db.prepare(
               `INSERT INTO items (name, sku, description, cost_price, quantity, category, storage_location, variant, status)
                VALUES (@name, @sku, @description, @cost_price, @quantity, @category, @storage_location, @variant, @status)`
           );
           // Execute the statement with data from the renderer
           const result = stmt.run({
               name: itemData.name.trim(),
               sku: itemData.sku || null,
               description: itemData.description || null,
               cost_price: parseFloat(itemData.cost_price) || 0.0, // Ensure numeric
               quantity: parseInt(itemData.quantity, 10) || 0,   // Ensure integer
               category: itemData.category,                      // ADDED
               storage_location: itemData.storage_location,      // ADDED (frontend sends this)
               variant: itemData.variant || null,                // ADDED
               status: itemData.status || 'Normal'               // ADDED (default if not provided)
           });
           console.log(`IPC Main: Added item with ID ${result.lastInsertRowid}. Changes: ${result.changes}`);
           return { success: true, id: result.lastInsertRowid };
       } catch (error) {
           console.error('IPC Main: Error adding item:', error);
           if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
               throw new Error(`SKU "${itemData.sku}" already exists. Please use a unique SKU.`);
           }
           throw error;
       }
   });

   // Handle request to update an existing item
   ipcMain.handle('db:update-item', (event, itemData) => {
       console.log('IPC Main: Received db:update-item request with data:', itemData);
       if (!db) throw new Error("Database not initialized");
       try {
           if (!itemData || !itemData.id || !itemData.name || itemData.name.trim() === '') {
               throw new Error("Item ID and Name are required for update.");
           }
           // ADD VALIDATION for category and storage_location if they are mandatory
           if (!itemData.category) {
               throw new Error("Item category is required for update.");
           }
           if (!itemData.storage_location) { // Frontend sends storage_location
               throw new Error("Item storage location is required for update.");
           }

           // Prepare SQL statement for update
           // ADD category, storage_location, variant, status to SET clause
           const stmt = db.prepare(
               `UPDATE items SET
                   name = @name,
                   sku = @sku,
                   description = @description,
                   cost_price = @cost_price,
                   quantity = @quantity,
                   category = @category,
                   storage_location = @storage_location,
                   variant = @variant,
                   status = @status,
                   updated_at = CURRENT_TIMESTAMP
                WHERE id = @id` // Also update updated_at manually
           );
           // Execute the update
           const result = stmt.run({
               id: itemData.id,
               name: itemData.name.trim(),
               sku: itemData.sku || null,
               description: itemData.description || null,
               cost_price: parseFloat(itemData.cost_price) || 0.0, // Ensure numeric
               quantity: parseInt(itemData.quantity, 10) || 0,   // Ensure integer
               category: itemData.category,                      // ADDED
               storage_location: itemData.storage_location,      // ADDED
               variant: itemData.variant || null,                // ADDED
               status: itemData.status || 'Normal'               // ADDED
           });

           if (result.changes === 0) {
               const checkStmt = db.prepare('SELECT 1 FROM items WHERE id = ?');
               const exists = checkStmt.get(itemData.id);
               if (!exists) {
                   throw new Error(`Item with ID ${itemData.id} not found for update.`);
               } else {
                   console.log(`IPC Main: Item ${itemData.id} data was unchanged or item not found.`);
                   // If you want to distinguish between "not found" and "unchanged", you'd need another query
                   // For now, let's assume it might be unchanged.
                   return { success: true, message: "No changes detected or item not found.", unchanged: true };
               }
           } else {
               console.log(`IPC Main: Updated item with ID ${itemData.id}. Changes: ${result.changes}`);
           }
           return { success: true };
       } catch (error) {
           console.error('IPC Main: Error updating item:', error);
           if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
               throw new Error(`SKU "${itemData.sku}" already exists. Please use a unique SKU.`);
           }
           throw error;
       }
   });


   ipcMain.handle('db:delete-item', async (event, itemId) => { // Or 'delete-item'
     console.log(`Main: Delete request for item ID: ${itemId}`);

     // --- ROLE CHECK ---
     if (!currentUser || currentUser.role !== 'admin') {
         console.warn(`Main: Unauthorized delete attempt by user: ${currentUser?.username} (Role: ${currentUser?.role})`);
         // You could return an error object or throw an error
         // Returning a specific structure is often better for IPC
         return { success: false, message: 'Permission denied: Only admins can delete items.' };
     }
     // --- END ROLE CHECK ---

     // If check passes, proceed with deletion logic...
    // REPLACE the existing try...catch block in 'db:delete-item' handler with this:
    try {
        // Prepare the DELETE statement
        const stmt = db.prepare('DELETE FROM items WHERE id = ?');

        // Execute the statement with the itemId
        // .run() returns an info object with { changes, lastInsertRowid }
        const result = stmt.run(itemId);

        // Check if any row was actually deleted
        if (result.changes === 0) {
            // Item ID might not exist
            console.warn(`Main: Item ID ${itemId} not found for deletion.`);
            // Return success: false because the intended item wasn't deleted
            return { success: false, message: `Item with ID ${itemId} not found.` };
        } else {
            // Deletion was successful
            console.log(`Main: Successfully deleted item ID: ${itemId}. Changes: ${result.changes}`);
            return { success: true };
        }

    } catch (error) {
        // Handle any potential database errors during prepare or run
        console.error('Main: DB Error in delete-item handler:', error);
        // Return success: false and the error message
        return { success: false, message: `Database error during deletion: ${error.message}` };
        // Alternatively, you could re-throw the error if you want the frontend's main catch block to handle it:
        // throw new Error(`Database error during deletion: ${error.message}`);
    }
   });

   // --- Authentication IPC Handlers ---

   function readUsers() {
     try {
       // Check if file exists before reading
       if (fs.existsSync(usersFilePath)) {
         const data = fs.readFileSync(usersFilePath, 'utf-8');
         return JSON.parse(data);
       }
       console.warn(`Users file not found at: ${usersFilePath}`);
       return []; // Return empty array if file doesn't exist
     } catch (error) {
       console.error("Error reading users file:", error);
       return []; // Return empty on error
     }
   }

   ipcMain.handle('login', async (event, { username, password }) => {
     console.log(`Main: Login attempt for username: ${username}`);
     const users = readUsers();
     const user = users.find(u => u.username === username);

     if (!user) {
       console.log('Main: Login failed - User not found');
       return { success: false, message: 'Invalid username or password.' };
     }

     // Check if user has a password defined
     if (!user.password) {
         console.log(`Main: Login failed - User ${username} has no password set.`);
         return { success: false, message: 'Login configuration error for user.' };
     }

     try {
       // Compare provided password with the stored hash
       const match = await bcrypt.compare(password, user.password);
       if (match) {
         console.log(`Main: Login successful for ${username}, Role: ${user.role}`);
         // Store user info (IMPORTANT: Exclude password hash)
         currentUser = {
           id: user.id,
           username: user.username,
           role: user.role
         };
         // Send back success and the user object (without password)
         return { success: true, user: currentUser };
       } else {
         console.log('Main: Login failed - Password mismatch');
         return { success: false, message: 'Invalid username or password.' };
       }
     } catch (error) {
       console.error("Main: Error during password comparison:", error);
       return { success: false, message: 'An error occurred during login.' };
     }
   });

   ipcMain.handle('logout', async () => {
     if (currentUser) {
       console.log(`Main: User ${currentUser.username} logging out.`);
     } else {
       console.log("Main: Logout called, but no user was logged in.");
     }
     currentUser = null; // Clear the session variable
     return { success: true };
   });

   // Allows the frontend to check who is logged in when it starts up
   ipcMain.handle('get-current-user', async () => {
     console.log("Main: get-current-user called. Returning:", currentUser);
     return currentUser; // Send the currently stored user object, or null
   });

   // --- End Authentication IPC Handlers ---
   // REPLACE the existing 'get-inventory-summary' handler's try...catch block with this:
   ipcMain.handle('get-inventory-summary', async () => { // Keep async for consistency, though DB calls are sync
     console.log("Main: Handling get-inventory-summary request...");
     if (!db) throw new Error("Database not initialized"); // Check db connection

     try {
       // Prepare and execute queries using better-sqlite3 synchronous API
       const countStmt = db.prepare('SELECT COUNT(id) as count FROM items');
       const totalItemsResult = countStmt.get().count || 0; // Execute and get result

       const quantityStmt = db.prepare('SELECT SUM(quantity) as total FROM items');
       const totalQuantityResult = quantityStmt.get().total || 0; // Execute and get result

       const valueStmt = db.prepare('SELECT SUM(quantity * COALESCE(cost_price, 0)) as value FROM items');
       const totalValueResult = valueStmt.get().value || 0; // Execute and get result

       console.log("Main: Inventory Summary:", { totalItemsResult, totalQuantityResult, totalValueResult });
       return {
         success: true,
         summary: {
           totalItems: totalItemsResult,
           totalQuantity: totalQuantityResult,
           totalValue: totalValueResult
         }
       };
     } catch (error) {
       console.error("Main: Error getting inventory summary:", error);
       // Return error object to the frontend
       return { success: false, message: 'Failed to retrieve inventory summary. ' + error.message };
     }
   });

   // REPLACE the existing 'get-low-stock-items' handler's try...catch block with this:
   ipcMain.handle('get-low-stock-items', async (event, threshold = 10) => { // Keep async
     console.log(`Main: Handling get-low-stock-items request (threshold: ${threshold})...`);
     if (!db) throw new Error("Database not initialized"); // Check db connection

     try {
       // Prepare the statement
       const stmt = db.prepare('SELECT id, name, sku, quantity FROM items WHERE quantity < ? ORDER BY quantity ASC');
       // Execute with the threshold parameter and get all results
       const items = stmt.all(threshold); // Pass parameters to .all()

       console.log(`Main: Found ${items.length} low stock items.`);
       return { success: true, items: items };
     } catch (error) {
       console.error("Main: Error getting low stock items:", error);
       // Return error object to the frontend
       return { success: false, message: 'Failed to retrieve low stock items. ' + error.message };
     }
   });
   ipcMain.handle('process-inventory-file', async (event, { fileData, actionType, columnMapping }) => {
       console.log(`Main: Received process-inventory-file request. Action: ${actionType}`);
       if (!db) throw new Error("Database not initialized");

       let workbook;
       let rows = [];
       let errors = [];
       let processedCount = 0;
       let successCount = 0;

       try {
           // --- 1. Parse the file based on type ---
           if (fileData.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileData.name.endsWith('.xlsx')) {
               // Parse XLSX using 'xlsx' library
               const buffer = Buffer.from(fileData.contentBase64, 'base64');
               workbook = XLSX.read(buffer, { type: 'buffer' });
               const sheetName = workbook.SheetNames[0]; // Assume data is on the first sheet
               const worksheet = workbook.Sheets[sheetName];
               rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }); // Get array of arrays
               // Remove header row if present (simple check)
               if (rows.length > 0 && rows[0].includes(columnMapping.sku) && rows[0].includes(columnMapping.quantity)) {
                    rows.shift(); // Remove header
               }
           } else if (fileData.type === 'text/csv' || fileData.name.endsWith('.csv')) {
               // Parse CSV using 'papaparse' library
               const csvString = Buffer.from(fileData.contentBase64, 'base64').toString('utf8');
               const parseResult = Papa.parse(csvString, {
                   header: true, // Assume first row is header
                   skipEmptyLines: true,
               });
               rows = parseResult.data; // Array of objects if header: true
               if (parseResult.errors.length > 0) {
                   errors.push(`CSV Parsing Errors: ${JSON.stringify(parseResult.errors)}`);
               }
           } else {
               throw new Error(`Unsupported file type: ${fileData.type || fileData.name}`);
           }

           if (rows.length === 0) {
                throw new Error("No data rows found in the file.");
           }

           // --- 2. Process rows within a transaction ---
           const updateStmt = {
               add: db.prepare('UPDATE items SET quantity = quantity + CAST(@qty AS INTEGER) WHERE sku = @sku'),
               deduct: db.prepare('UPDATE items SET quantity = quantity - CAST(@qty AS INTEGER) WHERE sku = @sku'),
               set: db.prepare('UPDATE items SET quantity = CAST(@qty AS INTEGER) WHERE sku = @sku')
           };

           if (!updateStmt[actionType]) {
               throw new Error(`Invalid action type: ${actionType}`);
           }

           const transaction = db.transaction((dataRows) => {
               for (const [index, row] of dataRows.entries()) {
                   processedCount++;
                   let sku, quantity;

                   // Extract data based on parsing method (array vs object)
                   if (Array.isArray(row)) { // From XLSX sheet_to_json header: 1
                       // Find column index based on header mapping (assuming header was removed)
                       // This part needs refinement based on how you get column indices
                       // For simplicity, let's assume fixed columns for now: Col 0 = SKU, Col 1 = Qty
                       sku = row[0]?.toString().trim();
                       quantity = row[1];
                   } else { // From PapaParse header: true
                       sku = row[columnMapping.sku]?.toString().trim();
                       quantity = row[columnMapping.quantity];
                   }

                   // Basic Validation
                   if (!sku) {
                       errors.push(`Row ${index + 1}: Missing SKU.`);
                       continue; // Skip this row
                   }
                   const parsedQty = parseInt(quantity, 10);
                   if (isNaN(parsedQty)) {
                       errors.push(`Row ${index + 1} (SKU: ${sku}): Invalid quantity "${quantity}".`);
                       continue; // Skip this row
                   }

                   // Execute the update
                   try {
                       const result = updateStmt[actionType].run({ sku: sku, qty: parsedQty });
                       if (result.changes === 0) {
                           errors.push(`Row ${index + 1}: SKU "${sku}" not found in database.`);
                       } else {
                           successCount++;
                       }
                   } catch (dbError) {
                        errors.push(`Row ${index + 1} (SKU: ${sku}): DB Error - ${dbError.message}`);
                   }
               }
               // If significant errors occurred, you might choose to throw here to rollback
               // if (errors.length > dataRows.length / 2) { // Example: rollback if >50% errors
               //    throw new Error("Too many errors during processing. Rolling back changes.");
               // }
           });

           // Execute the transaction
           transaction(rows);

           console.log(`Main: File processing complete. Processed: ${processedCount}, Success: ${successCount}, Errors: ${errors.length}`);
           return {
               success: errors.length === 0, // Overall success if no errors
               processedCount,
               successCount,
               errors, // Send back list of errors
           };

       } catch (error) {
           console.error("Main: Error processing inventory file:", error);
           return { success: false, errors: [error.message] }; // Return general error
       }
   });

   ipcMain.handle('import-initial-items', async (event, { fileData }) => {
       console.log(`Main: Received import-initial-items request.`);
       if (!db) throw new Error("Database not initialized");

       let workbook;
       let rows = [];
       let errors = [];
       let processedCount = 0;
       let successCount = 0;

       // --- Define EXPECTED column order/headers ---
       const expectedHeaders = ['SKU', 'Name', 'Description', 'Cost', 'Quantity'];
       const skuIndex = 0;
       const nameIndex = 1;
       const descIndex = 2;
       const costIndex = 3;
       const qtyIndex = 4;
       // --- ---

       try {
           // --- 1. Parse the file ---
           if (fileData.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileData.name.endsWith('.xlsx')) {
               const buffer = Buffer.from(fileData.contentBase64, 'base64');
               workbook = XLSX.read(buffer, { type: 'buffer' });
               const sheetName = workbook.SheetNames[0];
               const worksheet = workbook.Sheets[sheetName];
               rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

               if (rows.length > 0 && JSON.stringify(rows[0].slice(0, expectedHeaders.length)) === JSON.stringify(expectedHeaders)) {
                    console.log("Main: Detected and removing header row from XLSX.");
                    rows.shift();
               } else if (rows.length > 0) {
                    console.warn("Main: XLSX header row doesn't exactly match expected. Proceeding assuming column order.");
               }

           } else if (fileData.type === 'text/csv' || fileData.name.endsWith('.csv')) {
               const csvString = Buffer.from(fileData.contentBase64, 'base64').toString('utf8');
               const parseResult = Papa.parse(csvString, {
                   header: true,
                   skipEmptyLines: true,
                   transformHeader: header => header.trim(),
               });
               rows = parseResult.data;
               if (parseResult.errors.length > 0) {
                   errors.push(`CSV Parsing Errors: ${JSON.stringify(parseResult.errors)}`);
               }
               const actualHeaders = parseResult.meta.fields;
               if (!actualHeaders || !expectedHeaders.every(h => actualHeaders.includes(h))) {
                    throw new Error(`CSV file missing required headers. Expected: ${expectedHeaders.join(', ')}. Found: ${actualHeaders?.join(', ')}`);
               }

           } else {
               throw new Error(`Unsupported file type: ${fileData.type || fileData.name}`);
           }

           if (rows.length === 0) {
                throw new Error("No data rows found in the file.");
           }

           // --- 2. Process rows within a transaction ---
           const insertStmt = db.prepare(
               'INSERT INTO items (sku, name, description, cost_price, quantity) VALUES (@sku, @name, @desc, @cost, @qty)'
           );

           // Define the transaction function
           const transaction = db.transaction((dataRows) => {
               // Loop through each row provided to the transaction
               for (const [index, row] of dataRows.entries()) {
                   processedCount++;
                   let sku, name, description, costPrice, quantity;

                   // Extract data based on parsing method
                   if (Array.isArray(row)) { // From XLSX
                       sku = row[skuIndex]?.toString().trim();
                       name = row[nameIndex]?.toString().trim();
                       description = row[descIndex]?.toString().trim() || null;
                       costPrice = row[costIndex];
                       quantity = row[qtyIndex];
                   } else { // From PapaParse (CSV object)
                       sku = row[expectedHeaders[skuIndex]]?.toString().trim();
                       name = row[expectedHeaders[nameIndex]]?.toString().trim();
                       description = row[expectedHeaders[descIndex]]?.toString().trim() || null;
                       costPrice = row[expectedHeaders[costIndex]];
                       quantity = row[expectedHeaders[qtyIndex]];
                   }

                   // --- Validation ---
                   if (!sku) {
                       errors.push(`Row ${index + 2}: Missing SKU.`);
                       continue; // Skip this row
                   }
                   if (!name) {
                       errors.push(`Row ${index + 2} (SKU: ${sku}): Missing Name.`);
                       continue; // Skip this row
                   }
                   const parsedCost = parseFloat(costPrice);
                   if (costPrice === null || costPrice === undefined || costPrice === '' || isNaN(parsedCost) || parsedCost < 0) {
                        errors.push(`Row ${index + 2} (SKU: ${sku}): Invalid or missing Cost "${costPrice}". Using 0.00.`);
                        costPrice = 0.0;
                   }
                   const parsedQty = parseInt(quantity, 10);
                   if (quantity === null || quantity === undefined || quantity === '' || isNaN(parsedQty) || parsedQty < 0) {
                       errors.push(`Row ${index + 2} (SKU: ${sku}): Invalid or missing Quantity "${quantity}". Using 0.`);
                       quantity = 0;
                   }
                   // --- End Validation ---

                   // Execute the insert - Ensure mapping is correct
                   try {
                       insertStmt.run({
                           sku: sku,
                           name: name,
                           desc: description,
                           cost: parseFloat(costPrice) || 0.0,
                           qty: parseInt(quantity, 10) || 0
                       });
                       successCount++;
                   } catch (dbError) {
                        // Error handling remains the same
                        if (dbError.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                            errors.push(`Row ${index + 2}: SKU "${sku}" already exists in database. Skipped.`);
                        } else {
                            errors.push(`Row ${index + 2} (SKU: ${sku}): DB Error - ${dbError.message}`);
                        }
                   } // <<< Added missing closing brace for inner catch block
               } // <<< Added missing closing brace for the 'for' loop
           }); // <<< This }); correctly closes the transaction function definition

           // Execute the transaction with the parsed rows
           transaction(rows);

           console.log(`Main: Initial import complete. Processed: ${processedCount}, Success: ${successCount}, Errors: ${errors.length}`);
           return { // return success object
               success: errors.length === 0,
               processedCount,
               successCount,
               errors,
           }; // end of return object

       } catch (error) { // end of main try for import-initial-items, start of main catch
           console.error("Main: Error processing initial import file:", error);
           return { success: false, errors: [error.message] };
       } // end of main catch for import-initial-items
   }); // end of ipcMain.handle for import-initial-items

