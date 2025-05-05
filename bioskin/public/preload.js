// public/preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script executing...'); // Log for debugging

// Expose specific functions to the renderer process via 'window.electronAPI'
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    // --- Existing IMS Functions ---
    getItems: () => {
      console.log('Preload: invoking db:get-items');
      // IMPORTANT: Make sure the channel name 'db:get-items' matches what you use in main.js
      // If you used 'get-items' in main.js, change it here too.
      return ipcRenderer.invoke('db:get-items'); // Or 'get-items'
    },
    addItem: (itemData) => {
      console.log('Preload: invoking db:add-item with', itemData);
      // If you used 'add-item' in main.js, change it here too.
      return ipcRenderer.invoke('db:add-item', itemData); // Or 'add-item'
    },
    updateItem: (itemData) => {
      console.log(`Preload: invoking db:update-item for ID: ${itemData.id}`);
      // If you used 'update-item' in main.js, change it here too.
      return ipcRenderer.invoke('db:update-item', itemData); // Or 'update-item'
    },
    deleteItem: (itemId) => {
      console.log(`Preload: invoking db:delete-item for ID: ${itemId}`);
      // If you used 'delete-item' in main.js, change it here too.
      return ipcRenderer.invoke('db:delete-item', itemId); // Or 'delete-item'
    }, // <-- Add comma here

    // --- NEW Authentication Functions ---
    login: (credentials) => {
      console.log('Preload: invoking login with credentials');
      // Uses the 'login' channel defined in main.js
      return ipcRenderer.invoke('login', credentials);
    },
    logout: () => {
      console.log('Preload: invoking logout');
      // Uses the 'logout' channel defined in main.js
      return ipcRenderer.invoke('logout');
    },
    getCurrentUser: () => {
      console.log('Preload: invoking get-current-user');
      // Uses the 'get-current-user' channel defined in main.js
      return ipcRenderer.invoke('get-current-user');
    }
    // No comma needed after the last function
  }
);

console.log('Preload script finished exposing electronAPI.'); // Log for debugging