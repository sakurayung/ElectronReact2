// src/ItemList.js
import React from 'react';

function ItemList({ items, onEdit, onDelete, userRole }) {

  // Handle case where items might be null or undefined initially
  if (!items) {
    return (
       <table id="itemTable">
         <thead>
           {/* Table headers */}
           <tr>
             <th>Name</th>
             <th>SKU</th>
             <th>Description</th>
             <th className="text-right">Cost Price</th>
             <th className="text-right">Quantity</th>
             <th className="text-center">Actions</th>
           </tr>
         </thead>
         <tbody>
           <tr><td colSpan="6" className="text-center">Loading...</td></tr>
         </tbody>
       </table>
    );
  }

  if (items.length === 0) {
    return (
      <table id="itemTable">
        <thead>
          {/* Table headers */}
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Description</th>
            <th className="text-right">Cost Price</th>
            <th className="text-right">Quantity</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td colSpan="6" className="text-center">No items found. Add one!</td>
          </tr>
        </tbody>
      </table>
    );
  }

  return (
    <table id="itemTable">
      <thead>
        <tr>
          <th>Name</th>
          <th>SKU</th>
          <th>Description</th>
          <th className="text-right">Cost Price</th>
          <th className="text-right">Quantity</th>
          <th className="text-center">Actions</th>
        </tr>
      </thead>
      <tbody id="itemTableBody">
        {items.map(item => (
          // Use item.id as the unique key for each row
          <tr key={item.id}>
            <td>{item.name}</td>
            <td>{item.sku || 'N/A'}</td>
            <td>{item.description || 'N/A'}</td>
            <td className="text-right">{item.cost_price !== null ? item.cost_price.toFixed(2) : 'N/A'}</td>
            <td className="text-right">{item.quantity}</td>
            <td className="text-center table-actions">
              {/* Edit Button */}
              <button
                className="button-edit" // Add specific class if needed in your CSS
                onClick={() => onEdit(item)} // Pass the whole item object to the edit handler
                style={{ marginRight: '5px' }}
              >
                Edit
              </button>
              {/* Delete Button */}
              {userRole === 'admin' && (
                    <button
                      className="button-delete" // Use class from your CSS
                      onClick={() => onDelete(item.id)} // Pass only the ID to the delete handler
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