// src/ItemForm.js
import React, { useState, useEffect } from 'react';

function ItemForm({ onSubmit, onCancelEdit, initialData }) {
  // State for form fields
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [costPrice, setCostPrice] = useState('0.00');
  const [quantity, setQuantity] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!initialData; // Check if we are editing based on initialData

  // Effect to populate form when initialData changes (for editing)
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setSku(initialData.sku || '');
      setDescription(initialData.description || '');
      setCostPrice(initialData.cost_price !== null ? initialData.cost_price.toFixed(2) : '0.00');
      setQuantity(initialData.quantity !== null ? String(initialData.quantity) : '0');
    } else {
      // Reset form if initialData becomes null (e.g., after successful add/update or cancel)
      setName('');
      setSku('');
      setDescription('');
      setCostPrice('0.00');
      setQuantity('0');
    }
  }, [initialData]); // Rerun effect when initialData changes

    // Inside ItemForm.js
    const handleSubmit = async (event) => {
      event.preventDefault();
      if (!name.trim()) {
          alert('Please enter an item name.');
          return;
      }
      setIsSubmitting(true);
      const itemData = {
        id: initialData ? initialData.id : undefined, // Include ID only if editing
        name: name.trim(),
        sku: sku.trim() || null,
        description: description.trim() || null,
        cost_price: parseFloat(costPrice) || 0.0,
        quantity: parseInt(quantity, 10) || 0,
      };

      // Call the handler passed from App.js (which is handleSaveItem)
      const success = await onSubmit(itemData);
      setIsSubmitting(false);

      // *** ADD THIS BLOCK BACK ***
      // If the operation was successful AND we were NOT editing (i.e., we were adding)
      // then manually clear the form fields here.
      if (success && !isEditing) {
          console.log("ItemForm handleSubmit: Add successful, explicitly resetting fields."); // Optional log
          setName('');
          setSku('');
          setDescription('');
          setCostPrice('0.00');
          setQuantity('0');
      }
      // *** END OF ADDED BLOCK ***

      // If editing, the useEffect hook will still handle clearing when
      // App.js sets currentItem to null after a successful update or cancel.
    };

  const handleCancel = () => {
      onCancelEdit(); // Call handler passed from App.js
      // Resetting form fields is handled by the useEffect hook when initialData becomes null
  }

  return (
    // Use class names from your index.css
    <section className="form-section card">
      <form id="itemForm" onSubmit={handleSubmit}>
        <h2 id="formTitle">{isEditing ? 'Edit Item' : 'Add New Item'}</h2>

        <div className="form-group">
          <label htmlFor="itemName">Name:</label>
          <input
            type="text" id="itemName" name="itemName" required
            value={name} onChange={(e) => setName(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="itemSku">SKU:</label>
          <input
            type="text" id="itemSku" name="itemSku"
            value={sku} onChange={(e) => setSku(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="form-group">
          <label htmlFor="itemDescription">Description:</label>
          <textarea
            id="itemDescription" name="itemDescription" rows="3"
            value={description} onChange={(e) => setDescription(e.target.value)}
            disabled={isSubmitting}
          ></textarea>
        </div>
        <div className="form-row">
          <div className="form-group form-group-inline">
            <label htmlFor="itemCostPrice">Cost Price:</label>
            <input
              type="number" id="itemCostPrice" name="itemCostPrice" min="0" step="0.01"
              value={costPrice} onChange={(e) => setCostPrice(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="form-group form-group-inline">
            <label htmlFor="itemQuantity">Quantity:</label>
            <input
              type="number" id="itemQuantity" name="itemQuantity" min="0"
              value={quantity} onChange={(e) => setQuantity(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" id="formSubmitButton" className="button button-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (isEditing ? 'Update Item' : 'Add Item')}
          </button>
          {isEditing && (
            <button type="button" id="cancelEditButton" className="button button-secondary" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

export default ItemForm;