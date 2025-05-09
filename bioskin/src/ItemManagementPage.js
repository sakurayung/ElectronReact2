// src/ItemManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemList from './ItemList';
import {
    FaSearch,
    FaSlidersH,
    FaThLarge,
    FaPlus,
    FaFileAlt
} from 'react-icons/fa';
import './ItemManagementPage.css';

function ItemManagementPage({ currentUser }) {
    const [items, setItems] = useState([]); // Initialize with empty array
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStorage, setSelectedStorage] = useState('');

    const navigate = useNavigate();

    // Debounce search term
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    useEffect(() => {
        const timerId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500); // 500ms delay

        return () => {
            clearTimeout(timerId);
        };
    }, [searchTerm]);


    // Modified loadItems to accept and use filters
    const loadItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // CRITICAL LOG 1: What are the filter states JUST BEFORE building payload?
        console.log("ItemManagementPage: Current filter states:", {
            selectedCategory,
            selectedStorage,
            debouncedSearchTerm
        });

        const filterPayload = {
            category: selectedCategory || null,
            storageLocation: selectedStorage || null,
            searchTerm: debouncedSearchTerm || null
        };

        // CRITICAL LOG 2: What is the payload being sent to electronAPI.getItems?
        console.log("ItemManagementPage: Calling electronAPI.getItems with filterPayload:", JSON.stringify(filterPayload, null, 2));

        try {
            const fetchedItems = await window.electronAPI.getItems(filterPayload);

            console.log("ItemManagementPage: Fetched items from backend:", fetchedItems ? fetchedItems.length : 'null/undefined');

            if (fetchedItems && Array.isArray(fetchedItems)) {
                setItems(fetchedItems);
            } else {
                console.warn("ItemManagementPage: getItems did not return an array. Received:", fetchedItems);
                setItems([]);
            }
        } catch (err) {
            console.error("ItemManagementPage: Error loading items:", err.message, err.stack); // Log stack for more detail
            setError(`Failed to load items: ${err.message}`);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, [selectedCategory, selectedStorage, debouncedSearchTerm, setIsLoading, setError, setItems]); // Added missing state setters to dependency array

    useEffect(() => {
        loadItems();
    }, [loadItems]); // loadItems is now a dependency, and it changes when its own dependencies change

    // navigateToEdit, navigateToAddNew, handleGenerateReport remain the same
    const navigateToEdit = (item) => {
        navigate(`/products/${item.id}/edit`);
    };

    const navigateToAddNew = () => {
        navigate('/products/new');
    };

    const handleGenerateReport = () => {
        alert("Report generation feature coming soon!");
    };

    // handleDeleteItem (if you decide to add delete functionality back to this page)
    const handleDeleteItem = async (itemId) => {
        if (window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
            setError(null);
            try {
                const result = await window.electronAPI.deleteItem(itemId);
                if (result.success) {
                    console.log(result.message);
                    loadItems(); // Reload items after successful deletion
                } else {
                    setError(result.message || 'Failed to delete item.');
                }
            } catch (err) {
                console.error("Error deleting item:", err);
                setError(`Error deleting item: ${err.message}`);
            }
        }
    };


    // The 'filteredItems' constant is no longer needed here,
    // as 'items' state will directly hold the backend-filtered data.

    const categories = ["Skincare", "Wellness", "Cosmetics", "Soap", "Beauty Soap"]; // Keep these for dropdown options
    const storageOptions = ["Main Warehouse", "Retail Shelf", "Online Fulfillment", "STORE"]; // Keep these

    return (
        <div className="item-management-page page-container">
            <header className="page-header-alt">
                <h1>Products List</h1>
            </header>

            <div className="content-block-wrapper">
                <div className="filter-section-alt">
                                    <div className="filters-bar"> {/* This is already display: flex; flex-direction: row; flex-wrap: wrap; */}

                                        {/* Group for First Row of Filters */}
                                        <div className="filter-row">
                                            <div className="search-input-group">
                                                <FaSearch className="search-icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Search Product Name or SKU"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                />
                                                <FaSlidersH className="filter-action-icon" title="Filter options" />
                                            </div>

                                            <div className="filter-dropdown-group">
                                                <FaThLarge className="filter-icon" />
                                                <select
                                                    value={selectedCategory}
                                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                                    className="filter-dropdown"
                                                >
                                                    <option value="">Choose Product Category</option>
                                                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                                </select>
                                            </div>
                                        </div> {/* End of filter-row */}

                                        {/* Storage Dropdown on its own (will wrap to next line or be styled for full width) */}
                                        <select
                                            value={selectedStorage}
                                            onChange={(e) => setSelectedStorage(e.target.value)}
                                            className="filter-dropdown standalone-filter storage-filter-full-width" // Added new class
                                        >
                                            <option value="">Choose Storage</option>
                                            {storageOptions.map(store => <option key={store} value={store}>{store}</option>)}
                                        </select>
                                    </div>
                                </div>

                <section className="stock-list-section">
                    {error && (
                        <div className="card" style={{ color: 'var(--color-status-danger)', padding: '1rem', marginBottom: '1rem', border: '1px solid var(--color-status-danger)', backgroundColor: 'rgba(211, 47, 47, 0.05)' }}>
                            Error: {error}
                        </div>
                    )}
                    <div className="table-container">
                        {isLoading ? (
                            <div className="loading-placeholder">Loading inventory...</div>
                        ) : (
                            <ItemList
                                items={items} // Pass the 'items' state directly
                                onEdit={navigateToEdit}
                                // Pass onDelete if you want delete buttons in the table
                                onDelete={handleDeleteItem}
                                userRole={currentUser?.role}
                            />
                        )}
                    </div>
                </section>

                <div className="page-actions-bar">
                    <button className="button" onClick={navigateToAddNew}>
                        <FaPlus style={{marginRight: '8px'}} /> Add New Stock
                    </button>
                    <button className="button" onClick={handleGenerateReport}>
                        <FaFileAlt style={{marginRight: '8px'}} /> Generate Report
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ItemManagementPage;