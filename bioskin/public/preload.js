// public/preload.js
const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script executing...');

contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    getItems: (filters) => { // The 'filters' argument comes from ItemManagementPage
      // CRITICAL LOG 3: What filters object does preload receive?
      console.log('Preload (electronAPI.getItems): received filters:', JSON.stringify(filters, null, 2));
      console.log('Preload: invoking db:get-items with these filters.');
      return ipcRenderer.invoke('db:get-items', filters); // Pass the received filters object
    },
    // ... other functions ...
    addItem: (itemData) => {
      console.log('Preload (electronAPI.addItem): received itemData:', JSON.stringify(itemData, null, 2));
      console.log('Preload: invoking db:add-item with itemData.');
      return ipcRenderer.invoke('db:add-item', itemData);
    },
    updateItem: (itemData) => {
      console.log(`Preload (electronAPI.updateItem): received itemData for ID ${itemData.id}:`, JSON.stringify(itemData, null, 2));
      console.log(`Preload: invoking db:update-item for ID: ${itemData.id}`);
      return ipcRenderer.invoke('db:update-item', itemData);
    },
    deleteItem: (itemId) => {
      console.log(`Preload (electronAPI.deleteItem): for ID: ${itemId}`);
      console.log(`Preload: invoking db:delete-item for ID: ${itemId}`);
      return ipcRenderer.invoke('db:delete-item', itemId);
    },
    getItemById: (id) => {
      console.log(`Preload (electronAPI.getItemById): for ID: ${id}`);
      console.log(`Preload: invoking get-item-by-id for ID: ${id}`);
      return ipcRenderer.invoke('get-item-by-id', id);
    },
    login: (credentials) => {
      console.log('Preload (electronAPI.login): with credentials');
      console.log('Preload: invoking login with credentials');
      return ipcRenderer.invoke('login', credentials);
    },
    logout: () => {
      console.log('Preload (electronAPI.logout): called');
      console.log('Preload: invoking logout');
      return ipcRenderer.invoke('logout');
    },
    getCurrentUser: () => {
      console.log('Preload (electronAPI.getCurrentUser): called');
      console.log('Preload: invoking get-current-user');
      return ipcRenderer.invoke('get-current-user');
    },
    getInventorySummary: () => {
        console.log('Preload (electronAPI.getInventorySummary): called');
        console.log('Preload: invoking get-inventory-summary');
        return ipcRenderer.invoke('get-inventory-summary');
    },
    getLowStockItems: (threshold) => {
        console.log('Preload (electronAPI.getLowStockItems): threshold:', threshold);
        console.log('Preload: invoking get-low-stock-items');
        return ipcRenderer.invoke('get-low-stock-items', threshold);
    },
     processInventoryFile: (fileInfo) => {
         console.log('Preload (electronAPI.processInventoryFile): called');
         console.log('Preload: invoking process-inventory-file');
         return ipcRenderer.invoke('process-inventory-file', fileInfo);
     },
     importInitialItems: (fileInfo) => {
         console.log('Preload (electronAPI.importInitialItems): called');
         console.log('Preload: invoking import-initial-items');
         return ipcRenderer.invoke('import-initial-items', fileInfo);
     }
  }
);

console.log('Preload script finished exposing electronAPI.');