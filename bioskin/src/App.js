// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, Link } from 'react-router-dom'; // Added Link import

import ItemForm from './ItemForm';
import ItemList from './ItemList';
import LoginPage from './LoginPage';
import AnalyticsPage from './AnalyticsPage'; // Make sure this is imported
import BulkUpdatePage from './BulkUpdatePage'; // Make sure this is imported
import InitialImportPage from './InitialImportPage'; // Make sure this is imported

// --- Main Application Component (Inventory View) ---
function InventoryApp({ currentUser, onLogout }) {
    const [items, setItems] = useState(null);
    const [currentItem, setCurrentItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    // const navigate = useNavigate(); // Removed as it wasn't used here

    const loadItems = useCallback(async () => {
        // ... (loadItems implementation remains the same) ...
        console.log('React: Requesting items...');
        setIsLoading(true);
        setError(null);
        try {
            const fetchedItems = await window.electronAPI.getItems();
            console.log('React: Received items:', fetchedItems);
            setItems(fetchedItems);
        } catch (err) {
            console.error('React: Error loading items:', err);
            setError('Failed to load items. ' + err.message);
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const handleSaveItem = async (itemData) => {
        // ... (handleSaveItem implementation remains the same) ...
        setError(null);
        const isUpdating = !!itemData.id;
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
                console.log("InventoryApp handleSaveItem: Save successful, calling loadItems() and setCurrentItem(null)");
                loadItems();
                setCurrentItem(null);
                return true;
            } else {
                setError(`Failed to ${isUpdating ? 'update' : 'add'} item (backend reported failure).`);
                return false;
            }
        } catch (err) {
            console.error(`React: Error ${isUpdating ? 'updating' : 'adding'} item:`, err);
            setError(`Error ${isUpdating ? 'updating' : 'adding'} item: ${err.message}`);
            return false;
        }
    };

    const handleDeleteItem = async (itemId) => {
        // ... (handleDeleteItem implementation remains the same) ...
        if (window.confirm('Are you sure you want to delete this item?')) {
            setError(null);
            try {
                console.log('React: Deleting item:', itemId);
                const result = await window.electronAPI.deleteItem(itemId);
                if (result.success) {
                    loadItems();
                    if (currentItem && currentItem.id === itemId) {
                        setCurrentItem(null);
                    }
                } else {
                    setError('Failed to delete item (backend reported failure).');
                }
            } catch (err) {
                console.error('React: Error deleting item:', err);
                setError(`Error deleting item: ${err.message}`);
            }
        }
    };

    const handleEditItem = (item) => {
        // ... (handleEditItem implementation remains the same) ...
        console.log('React: Setting item to edit:', item);
        setError(null);
        setCurrentItem(item);
        window.scrollTo(0, 0);
    };

    const handleCancelEdit = () => {
        // ... (handleCancelEdit implementation remains the same) ...
        setCurrentItem(null);
    };

    const handleLogout = async () => {
        // ... (handleLogout implementation remains the same) ...
        console.log("InventoryApp: Logging out...");
        try {
            await window.electronAPI.logout();
            onLogout(); // Call the function passed from AppRouter to clear state
        } catch (err) {
            console.error("Logout error:", err);
            setError("Failed to log out properly.");
        }
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1>Inventory Management</h1>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {currentUser && (
                        <span style={{ marginRight: '1rem', color: 'var(--color-text-muted)' }}>
                            Logged in as: {currentUser.username} ({currentUser.role})
                        </span>
                    )}
                     {/* Admin Links/Buttons */}
                        {currentUser?.role === 'admin' && (
                            <>
                                <Link to="/analytics" className="button button-primary" style={{ marginRight: '0.5rem' }}>
                                    Analytics
                                </Link>
                                {/* CHANGE CLASS HERE */}
                                <Link to="/bulk-update" className="button button-primary" style={{ marginRight: '0.5rem' }}>
                                    Bulk Update
                                </Link>
                                {/* CHANGE CLASS HERE */}
                                <Link to="/initial-import" className="button button-primary" style={{ marginRight: '0.5rem' }}>
                                    Initial Import
                                </Link>
                            </>
                        )}
                        {/* Logout Button */}
                        {/* CHANGE CLASS HERE */}
                        <button onClick={handleLogout} className="button button-primary">Logout</button>              </div>
            </header>

            <main>
                {/* Removed the placeholder Admin Controls Area card */}
                <ItemForm
                    onSubmit={handleSaveItem}
                    onCancelEdit={handleCancelEdit}
                    initialData={currentItem}
                    userRole={currentUser?.role}
                />
                <hr className="section-divider" />
                <section className="stock-section">
                    <h2>Current Stock</h2>
                    {error && <div className="card" style={{ color: 'red', marginBottom: '1rem', padding: '1rem' }}>Error: {error}</div>}
                    <div className="table-container card">
                        {isLoading ? (
                            <p style={{ textAlign: 'center', padding: '1rem' }}>Loading...</p>
                        ) : (
                            <ItemList
                                items={items}
                                onEdit={handleEditItem}
                                onDelete={handleDeleteItem}
                                userRole={currentUser?.role}
                            />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

// --- Protected Route Component ---
function ProtectedRoute({ user, children }) {
    // ... (ProtectedRoute implementation remains the same) ...
    const location = useLocation();
    if (!user) {
        console.log("ProtectedRoute: No user found, redirecting to /login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }
    return children;
}

// --- Main Router Component ---
function AppRouter() {
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        // ... (useEffect for auth check remains the same) ...
        const checkAuth = async () => {
            console.log("AppRouter: Checking initial authentication status...");
            try {
                const user = await window.electronAPI.getCurrentUser();
                console.log("AppRouter: Received current user:", user);
                if (user) {
                    setCurrentUser(user);
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error("Error checking auth status:", error);
                setCurrentUser(null);
            } finally {
                setAuthChecked(true);
            }
        };
        checkAuth();
    }, []);

    const handleLoginSuccess = (user) => {
        // ... (handleLoginSuccess implementation remains the same) ...
        console.log("AppRouter: Login successful, setting user:", user);
        setCurrentUser(user);
    };

    const handleLogout = () => {
        // ... (handleLogout implementation remains the same) ...
        console.log("AppRouter: Logout requested, clearing user.");
        setCurrentUser(null);
    };

    if (!authChecked) {
        // ... (loading indicator remains the same) ...
        return <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.2em' }}>Checking authentication...</div>;
    }

    // --- Corrected and Organized Routes ---
    return (
        <Router>
            <Routes>
                {/* Login Route */}
                <Route
                    path="/login"
                    element={
                        currentUser ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
                    }
                />

                {/* Main Inventory Route */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute user={currentUser}>
                            <InventoryApp currentUser={currentUser} onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />

                {/* Analytics Route (Admin Only) */}
                <Route
                    path="/analytics"
                    element={
                        <ProtectedRoute user={currentUser}>
                            {/* You could add role check here too, but ProtectedRoute handles basic auth */}
                            {currentUser?.role === 'admin' ? <AnalyticsPage /> : <Navigate to="/" replace />}
                        </ProtectedRoute>
                    }
                />

                {/* Bulk Update Route (Admin Only) */}
                <Route
                    path="/bulk-update"
                    element={
                        <ProtectedRoute user={currentUser}>
                            {currentUser?.role === 'admin' ? <BulkUpdatePage /> : <Navigate to="/" replace />}
                        </ProtectedRoute>
                    }
                />

                {/* Initial Import Route (Admin Only) */}
                <Route
                    path="/initial-import"
                    element={
                        <ProtectedRoute user={currentUser}>
                            {currentUser?.role === 'admin' ? <InitialImportPage /> : <Navigate to="/" replace />}
                        </ProtectedRoute>
                    }
                />

                {/* Catch-all Route */}
                <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} replace />} />

            </Routes>
        </Router>
    );
}

// Export the main router component
export default AppRouter;