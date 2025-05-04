// public/preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script executing...'); // Log for debugging

// Expose specific functions to the renderer process via 'window.electronAPI'
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    // Function renderer calls to get items
    // Invokes the 'db:get-items' handler in main.js
    getItems: () => {
      console.log('Preload: invoking db:get-items');
      return ipcRenderer.invoke('db:get-items');
    },

    // Function renderer calls to add an item
    // Sends itemData and invokes 'db:add-item' handler
    addItem: (itemData) => {
      console.log('Preload: invoking db:add-item with', itemData);
      return ipcRenderer.invoke('db:add-item', itemData);
    },

    // Function renderer calls to update an item
    // Sends itemData and invokes 'db:update-item' handler
    updateItem: (itemData) => {
      console.log(`Preload: invoking db:update-item for ID: ${itemData.id}`);
      return ipcRenderer.invoke('db:update-item', itemData);
    },

    // Function renderer calls to delete an item
    // Sends itemId and invokes 'db:delete-item' handler
    deleteItem: (itemId) => {
      console.log(`Preload: invoking db:delete-item for ID: ${itemId}`);
      return ipcRenderer.invoke('db:delete-item', itemId);
    }
    // No comma needed after the last function
  }
);

console.log('Preload script finished exposing electronAPI.'); // Log for debugging