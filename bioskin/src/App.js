// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
// Remove import './App.css'; if you deleted App.css
import ItemForm from './ItemForm'; // Should match ItemForm.js
import ItemList from './ItemList'; // Should match ItemList.js

function App() {
  const [items, setItems] = useState(null); // Start with null to indicate not yet loaded
  const [currentItem, setCurrentItem] = useState(null); // State for item being edited
  const [isLoading, setIsLoading] = useState(true); // Start in loading state
  const [error, setError] = useState(null); // State for storing errors

  // Function to load items from the backend (using useCallback for optimization)
  const loadItems = useCallback(async () => {
    console.log('React: Requesting items...');
    setIsLoading(true); // Set loading true when starting
    setError(null); // Clear previous errors
    try {
      // Use the function exposed by preload.js
      const fetchedItems = await window.electronAPI.getItems();
      console.log('React: Received items:', fetchedItems);
      setItems(fetchedItems); // Update state with fetched items
    } catch (err) {
      console.error('React: Error loading items:', err);
      setError('Failed to load items. ' + err.message); // Set error message
      setItems([]); // Set items to empty array on error to stop loading state
    } finally {
      setIsLoading(false); // Set loading false when done (success or error)
    }
  }, []); // Empty dependency array means this function is created once

  // useEffect hook to call loadItems when the component mounts
  useEffect(() => {
    loadItems();
  }, [loadItems]); // Dependency array includes loadItems

  // --- CRUD Handlers ---

  // Handles adding OR updating based on currentItem state
  const handleSaveItem = async (itemData) => {
    setError(null); // Clear previous errors
    const isUpdating = !!itemData.id; // Check if it's an update (has ID)

    try {
      let result;
      if (isUpdating) {
        console.log('React: Updating item:', itemData);
        result = await window.electronAPI.updateItem(itemData);
      } else {
        console.log('React: Adding item:', itemData);
        result = await window.electronAPI.addItem(itemData);
      }

      if (result.success) {
              // *** ADD THIS LINE BACK ***
              console.log("App.js handleSaveItem: Save successful, calling loadItems() and setCurrentItem(null)");
              // *** END OF ADDED LINE ***

              loadItems(); // Reload the list after successful save
              setCurrentItem(null); // Clear editing state
              return true; // Indicate success to the form
            }
       else {
         // This case might not happen if backend throws error instead
         setError(`Failed to ${isUpdating ? 'update' : 'add'} item (backend reported failure).`);
         return false;
      }
    } catch (err) {
      console.error(`React: Error ${isUpdating ? 'updating' : 'adding'} item:`, err);
      setError(`Error ${isUpdating ? 'updating' : 'adding'} item: ${err.message}`);
      return false; // Indicate failure to the form
    }
  };


  const handleDeleteItem = async (itemId) => {
    // Use window.confirm for simple confirmation
    if (window.confirm('Are you sure you want to delete this item?')) {
       setError(null); // Clear previous errors
      try {
        console.log('React: Deleting item:', itemId);
        const result = await window.electronAPI.deleteItem(itemId);
         if (result.success) {
          loadItems(); // Reload the list after deleting
          // If the deleted item was being edited, clear the form
          if (currentItem && currentItem.id === itemId) {
              setCurrentItem(null);
          }
        } else {
           // This case might not happen if backend throws error instead
           setError('Failed to delete item (backend reported failure).');
        }
      } catch (err) {
        console.error('React: Error deleting item:', err);
        setError(`Error deleting item: ${err.message}`);
      }
    }
  };

  // Function passed to ItemList to set the item being edited
  const handleEditItem = (item) => {
    console.log('React: Setting item to edit:', item);
    setError(null); // Clear errors when starting edit
    setCurrentItem(item); // Put the selected item's data into the currentItem state
    window.scrollTo(0, 0); // Scroll to top to make the form visible
  };

  // Function passed to ItemForm to cancel editing
  const handleCancelEdit = () => {
    setCurrentItem(null); // Clear the currentItem state
  };


  return (
    // Use class names from your index.css
    <div className="container">
      <header>
        <h1>Inventory Management</h1>
      </header>

      <main>
        {/* Pass save handler, cancel handler, and current item to the form */}
        <ItemForm
          onSubmit={handleSaveItem} // Use the combined save handler
          onCancelEdit={handleCancelEdit}
          initialData={currentItem} // Pass item data for editing, or null for adding
        />

        <hr className="section-divider" />

        {/* Stock Display Section */}
        <section className="stock-section">
            <h2>Current Stock</h2>
             {/* Display any errors */}
             {error && <div className="card" style={{ color: 'red', marginBottom: '1rem', padding: '1rem' }}>Error: {error}</div>}
            <div className="table-container card">
                {/* Show loading message or the ItemList */}
                {isLoading ? (
                    <p style={{ textAlign: 'center', padding: '1rem' }}>Loading...</p>
                ) : (
                    <ItemList
                        items={items} // Pass the list of items
                        onEdit={handleEditItem} // Pass the edit handler
                        onDelete={handleDeleteItem} // Pass the delete handler
                    />
                )}
            </div>
        </section>

      </main>
    </div>
  );
}

export default App;