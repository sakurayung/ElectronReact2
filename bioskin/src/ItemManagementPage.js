// src/ItemManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import ItemList from './ItemList';
import {
    FaSearch, FaFilter, FaPlus, FaFileAlt,
    FaBell, FaUserCircle
} from 'react-icons/fa';
import './ItemManagementPage.css';

function ItemManagementPage({ currentUser }) {
    const [items, setItems] = useState(null);
    // Remove currentItem state and related handlers
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStorage, setSelectedStorage] = useState('');

    const navigate = useNavigate(); // Initialize navigate

    const loadItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // TODO: Add filtering to backend call if possible
            const fetchedItems = await window.electronAPI.getItems();
            setItems(fetchedItems || []);
        } catch (err) {
            setError('Failed to load items. ' + err.message);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    // Remove handleSaveItem, handleCancelEdit

    const handleDeleteItem = async (itemId) => { // Keep delete logic here
        if (window.confirm('Are you sure you want to delete this item?')) {
            setError(null);
            try {
                const result = await window.electronAPI.deleteItem(itemId);
                if (result.success) {
                    loadItems(); // Reload list after delete
                } else {
                    setError('Failed to delete item (backend reported failure).');
                }
            } catch (err) {
                setError(`Error deleting item: ${err.message}`);
            }
        }
    };

    // NEW: Navigate to the edit form page
    const navigateToEdit = (item) => {
        console.log('Navigating to edit item:', item.id);
        navigate(`/products/${item.id}/edit`);
    };

    // NEW: Navigate to the add form page
    const navigateToAddNew = () => {
        console.log('Navigating to add new item');
        navigate('/products/new');
    };

    const handleGenerateReport = () => {
        alert("Report generation feature coming soon!");
    };

    // Filtered items (frontend filtering)
    const filteredItems = items && items.filter(item => {
        const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
        const skuMatch = item.sku ? item.sku.toLowerCase().includes(searchTerm.toLowerCase()) : false;
        // TODO: Add backend filtering or add category/storage fields to item data
        // const categoryMatch = selectedCategory ? item.category === selectedCategory : true;
        // const storageMatch = selectedStorage ? item.storage === selectedStorage : true;
        return (nameMatch || skuMatch); // && categoryMatch && storageMatch;
    });

    // Placeholder data for filters
    const categories = ["Skincare", "Wellness", "Cosmetics", "Soap"];
    const storageOptions = ["Main Warehouse", "Retail Shelf", "Online Fulfillment"];

    return (
        // Removed container class, assuming Layout applies necessary constraints/padding
        <div className="item-management-page page-container">
            <header className="page-header-alt">
                <h1>MANAGE INVENTORY</h1>
                <div className="top-bar-icons">
                    <FaBell />
                    <FaUserCircle />
                </div>
            </header>

            {/* Wrapper for the main content block with border */}
            <div className="content-block-wrapper card">
                {/* Filters and Search Section (No longer a separate card) */}
                <div className="filter-section-alt">
                    {/* Removed H2 "Products List" */}
                    <div className="filters-bar">
                        <div className="search-input-group">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search Product Name or SKU"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="filter-dropdown"
                        >
                            <option value="">Choose Product Category</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <select
                            value={selectedStorage}
                            onChange={(e) => setSelectedStorage(e.target.value)}
                            className="filter-dropdown"
                        >
                            <option value="">Choose Storage</option>
                            {storageOptions.map(store => <option key={store} value={store}>{store}</option>)}
                        </select>
                    </div>
                </div>

                {/* Item List Section */}
                <section className="stock-list-section">
                    {error && <div className="error-message">{/* Style this appropriately */}Error: {error}</div>}
                    <div className="table-container">
                        {isLoading ? (
                            <div className="loading-placeholder">Loading...</div> // Style this placeholder
                        ) : (
                            <ItemList
                                items={filteredItems || []}
                                onEdit={navigateToEdit} // Pass navigation function
                                onDelete={handleDeleteItem}
                                userRole={currentUser?.role}
                            />
                        )}
                    </div>
                </section>

                {/* Action Buttons at the bottom (Inside the wrapper) */}
                <div className="page-actions-bar">
                    <button className="button" onClick={navigateToAddNew}> {/* Changed onClick */}
                        <FaPlus style={{marginRight: '8px'}} /> Add New Stock
                    </button>
                    <button className="button button-secondary" onClick={handleGenerateReport}>
                        <FaFileAlt style={{marginRight: '8px'}} /> Generate Report
                    </button>
                    <span className="last-updated">Last Updated</span> {/* Added placeholder */}
                </div>
            </div>
            {/* ItemForm is removed from here */}
        </div>
    );
}

export default ItemManagementPage;