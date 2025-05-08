// src/ItemList.js
import React from 'react';

// Function to determine stock status class
const getStockStatusClass = (quantity) => {
    if (quantity <= 0) return 'stock-status-low'; // Out of stock is also low
    if (quantity < 10) return 'stock-status-low'; // Example threshold for low
    if (quantity < 50) return 'stock-status-moderate'; // Example threshold for moderate
    return 'stock-status-high';
};

// Function to determine stock status text
const getStockStatusText = (quantity) => {
    if (quantity <= 0) return 'OUT OF STOCK';
    if (quantity < 10) return 'LOW';
    if (quantity < 50) return 'MODERATE';
    return 'HIGH';
}

function ItemList({ items, onEdit, onDelete, userRole }) {
  // ... (existing null/empty checks) ...
  if (!items) { /* ... same ... */ }
  if (items.length === 0) { /* ... same ... */ }

   return (
      <table id="itemTable">
        <thead>
          <tr>
            <th>Product</th>
            <th>Variant</th>
            <th>SKU Code</th>
            <th className="text-right">Quantity</th>
            <th className="text-right">Price</th>
            <th className="text-center">Stock</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody id="itemTableBody">
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.variant || 'N/A'}</td> {/* Use variant field */}
              <td>{item.sku || 'N/A'}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">
                  {/* Ensure correct price field is used */}
                {item.cost_price !== null ? `Php ${item.cost_price.toFixed(2)}` : 'N/A'}
              </td>
              <td className={`text-center ${getStockStatusClass(item.quantity)}`}>
                {getStockStatusText(item.quantity)}
              </td>
              <td className="text-center table-actions">
                <button
                  className="button-edit" // Use specific class
                  onClick={() => onEdit(item)} // onEdit now navigates
                >
                  Edit Details
                </button>
                {userRole === 'admin' && (
                  <button
                    className="button-delete" // Use specific class
                    onClick={() => onDelete(item.id)}
                  >
                    Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  export default ItemList;