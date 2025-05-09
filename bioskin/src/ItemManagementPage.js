// src/ItemManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ItemList from './ItemList';
import {
    FaSearch,
    FaSlidersH, // For the "tune" icon next to search
    FaThLarge,  // For the "grid" icon next to category
    FaPlus,
    FaFileAlt
} from 'react-icons/fa';
import './ItemManagementPage.css';

function ItemManagementPage({ currentUser }) {
    const [items, setItems] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStorage, setSelectedStorage] = useState('');

    const navigate = useNavigate();

    const loadItems = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const fetchedItems = await window.electronAPI.getItems();
            const itemsWithDemoFilters = (fetchedItems || []).map((item, index) => ({
                ...item,
                category: item.category || (["Skincare", "Wellness", "Cosmetics", "Soap", "Beauty Soap"][index % 5]),
                storage: item.storage || (["Main Warehouse", "Retail Shelf", "Online Fulfillment", "STORE"][index % 4]),
            }));
            setItems(itemsWithDemoFilters);
        } catch (err) {
            console.error("Error loading items:", err); // Log the actual error
            setError('Failed to load items. ' + err.message);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const navigateToEdit = (item) => {
        navigate(`/products/${item.id}/edit`);
    };

    const navigateToAddNew = () => {
        navigate('/products/new');
    };

    const handleGenerateReport = () => {
        alert("Report generation feature coming soon!");
    };

    const filteredItems = items && items.filter(item => {
        const searchTermLower = searchTerm.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(searchTermLower);
        const skuMatch = item.sku ? item.sku.toLowerCase().includes(searchTermLower) : false;

        const categoryMatch = selectedCategory ? item.category === selectedCategory : true;
        const storageMatch = selectedStorage ? item.storage === selectedStorage : true;

        return (nameMatch || skuMatch) && categoryMatch && storageMatch;
    });

    const categories = ["Skincare", "Wellness", "Cosmetics", "Soap", "Beauty Soap"];
    const storageOptions = ["Main Warehouse", "Retail Shelf", "Online Fulfillment", "STORE"];

    return (
        <div className="item-management-page page-container">
            <header className="page-header-alt">
                <h1>Products List</h1>
            </header>

            <div className="content-block-wrapper">

                <div className="filter-section-alt">
                    <div className="filters-bar">
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

                        <select
                            value={selectedStorage}
                            onChange={(e) => setSelectedStorage(e.target.value)}
                            className="filter-dropdown standalone-filter" // Added standalone-filter
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
                                items={filteredItems || []}
                                onEdit={navigateToEdit}
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