// public/preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script executing...'); // Log for debugging

contextBridge.exposeInMainWorld(
  'electronAPI',
  { // <--- Start of the main API object
    // --- Existing IMS Functions ---
    getItems: () => {
      console.log('Preload: invoking db:get-items');
      return ipcRenderer.invoke('db:get-items');
    },
    addItem: (itemData) => {
      console.log('Preload: invoking db:add-item with', itemData);
      return ipcRenderer.invoke('db:add-item', itemData);
    },
    updateItem: (itemData) => {
      console.log(`Preload: invoking db:update-item for ID: ${itemData.id}`);
      return ipcRenderer.invoke('db:update-item', itemData);
    },
    deleteItem: (itemId) => {
      console.log(`Preload: invoking db:delete-item for ID: ${itemId}`);
      return ipcRenderer.invoke('db:delete-item', itemId);
    }, // Comma needed

    // --- Existing Authentication Functions ---
    login: (credentials) => {
      console.log('Preload: invoking login with credentials');
      return ipcRenderer.invoke('login', credentials);
    },
    logout: () => {
      console.log('Preload: invoking logout');
      return ipcRenderer.invoke('logout');
    },
    getCurrentUser: () => {
      console.log('Preload: invoking get-current-user');
      return ipcRenderer.invoke('get-current-user');
    }, // <--- Added comma here

    // --- NEW Analytics Functions (MOVED INSIDE) ---
    getInventorySummary: () => {
        console.log('Preload: invoking get-inventory-summary');
        return ipcRenderer.invoke('get-inventory-summary');
    }, // <--- Added comma here
    getLowStockItems: (threshold) => {
        console.log('Preload: invoking get-low-stock-items');
        return ipcRenderer.invoke('get-low-stock-items', threshold);
    },
     processInventoryFile: (fileInfo) => { // fileInfo = { fileData, actionType, columnMapping }
         console.log('Preload: invoking process-inventory-file');
         return ipcRenderer.invoke('process-inventory-file', fileInfo);
     },
     importInitialItems: (fileInfo) => { // fileInfo = { fileData }
         console.log('Preload: invoking import-initial-items');
         return ipcRenderer.invoke('import-initial-items', fileInfo);
     }// <--- No comma here (last item)
    // --- End Add ---

  } // <--- End of the main API object literal
); // <--- End of the exposeInMainWorld call

console.log('Preload script finished exposing electronAPI.'); // Log for debugging