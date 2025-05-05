// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';

import ItemForm from './ItemForm'; // Keep your existing components
import ItemList from './ItemList';
import LoginPage from './LoginPage'; // Import the new Login page

// --- Main Application Component (Inventory View) ---
// We extract the original App content into its own component
function InventoryApp({ currentUser, onLogout }) {
    const [items, setItems] = useState(null);
    const [currentItem, setCurrentItem] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Hook for navigation actions

    const loadItems = useCallback(async () => {
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
        console.log('React: Setting item to edit:', item);
        setError(null);
        setCurrentItem(item);
        window.scrollTo(0, 0);
    };

    const handleCancelEdit = () => {
        setCurrentItem(null);
    };

    // --- Logout Handler ---
    const handleLogout = async () => {
        console.log("InventoryApp: Logging out...");
        try {
            await window.electronAPI.logout();
            onLogout(); // Call the function passed from AppRouter to clear state
            // Navigation back to login is handled by AppRouter's protected route
        } catch (err) {
            console.error("Logout error:", err);
            // Optionally show an error message to the user
            setError("Failed to log out properly.");
        }
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1>Inventory Management</h1>
                <div>
                    {currentUser && (
                        <span style={{ marginRight: '1rem', color: 'var(--color-text-muted)' }}>
                            Logged in as: {currentUser.username} ({currentUser.role})
                        </span>
                    )}
                    <button onClick={handleLogout} className="button button-secondary">Logout</button>
                </div>
            </header>

            <main>
                {/* Display role-specific content (Example) */}
                {currentUser?.role === 'admin' && (
                    <div className="card" style={{ marginBottom: '1rem', backgroundColor: '#e7f3ff' }}>
                        Admin Controls Area (Placeholder)
                    </div>
                )}

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
                                // Pass role if needed for conditional rendering in ItemList
                                // userRole={currentUser?.role}
                            />
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}

// --- Protected Route Component ---
// This component checks if the user is logged in.
// If yes, it renders the requested component (children).
// If not, it redirects to the login page.
function ProtectedRoute({ user, children }) {
    const location = useLocation(); // Get current location

    if (!user) {
        // Redirect them to the /login page, but save the current location they were
        // trying to go to. This allows redirecting back after login (optional).
        console.log("ProtectedRoute: No user found, redirecting to /login");
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If logged in, render the child component (e.g., InventoryApp)
    return children;
}


// --- Main Router Component ---
function AppRouter() {
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false); // State to track if initial auth check is done

    // Check login status when the app loads
    useEffect(() => {
        const checkAuth = async () => {
            console.log("AppRouter: Checking initial authentication status...");
            try {
                const user = await window.electronAPI.getCurrentUser();
                console.log("AppRouter: Received current user:", user);
                if (user) {
                    setCurrentUser(user); // Set user if already logged in (e.g., app restart)
                } else {
                    setCurrentUser(null);
                }
            } catch (error) {
                console.error("Error checking auth status:", error);
                setCurrentUser(null); // Assume not logged in on error
            } finally {
                setAuthChecked(true); // Mark auth check as complete
            }
        };
        checkAuth();
    }, []); // Empty dependency array ensures this runs only once on mount

    // Function called by LoginPage on successful login
    const handleLoginSuccess = (user) => {
        console.log("AppRouter: Login successful, setting user:", user);
        setCurrentUser(user);
    };

    // Function called by InventoryApp on logout
    const handleLogout = () => {
        console.log("AppRouter: Logout requested, clearing user.");
        setCurrentUser(null);
        // Navigation to /login happens automatically via ProtectedRoute
    };

    // Show loading indicator until initial auth check is complete
    if (!authChecked) {
        return <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.2em' }}>Checking authentication...</div>;
    }

    return (
        <Router>
            <Routes>
                <Route
                    path="/login"
                    element={
                        // If user is already logged in, redirect from /login to /
                        currentUser ? <Navigate to="/" replace /> : <LoginPage onLoginSuccess={handleLoginSuccess} />
                    }
                />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute user={currentUser}>
                            <InventoryApp currentUser={currentUser} onLogout={handleLogout} />
                        </ProtectedRoute>
                    }
                />
                {/* Add other routes here if needed */}
                {/* Example: Redirect any unknown path to the main page or login */}
                 <Route path="*" element={<Navigate to={currentUser ? "/" : "/login"} replace />} />
            </Routes>
        </Router>
    );
}

// Export the main router component
export default AppRouter;