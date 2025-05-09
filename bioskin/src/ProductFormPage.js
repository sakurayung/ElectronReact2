// FILE: src/ProductFormPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaThLarge } from 'react-icons/fa'; // Removed unused FaBell, FaUserCircle
import './ProductFormPage.css';
import SuccessModal from './SuccessModal'; // Import the modal

function ProductFormPage({ currentUser }) {
    const { id } = useParams(); // Get item ID from URL if editing
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        description: '',
        cost_price: '',
        quantity: '',
        category: '',
        storage: '',  // This is the frontend state name for storage
        variant: '',
        status: 'Normal', // Default status
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmDetails, setConfirmDetails] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Placeholder data for dropdowns - Ensure these match your actual available options
    const categories = ["Beauty Soap", "Skincare", "Wellness", "Cosmetics", "Soap"]; // Added "Soap" as it was in ItemManagementPage
    const storageOptions = ["STORE", "Main Warehouse", "Retail Shelf", "Online Fulfillment"]; // Added "Retail Shelf" as it was in ItemManagementPage

    useEffect(() => {
        if (isEditing) {
            setIsLoading(true); // Set loading true at the start of fetching
            const fetchItemData = async () => {
                setError('');
                try {
                    console.log(`ProductFormPage: Fetching item with ID: ${id}`);
                    const item = await window.electronAPI.getItemById(id);
                    // VERY IMPORTANT: Log the fetched item to see its structure
                    console.log("ProductFormPage: Fetched item for editing:", JSON.stringify(item, null, 2));

                    if (item) {
                        setFormData({
                            name: item.name || '',
                            sku: item.sku || '',
                            description: item.description || '',
                            cost_price: item.cost_price !== null ? String(item.cost_price) : '',
                            quantity: item.quantity !== null ? String(item.quantity) : '',
                            category: item.category || '', // Assumes backend returns 'category'
                            // Map the backend's storage field to the form's 'storage' field
                            // ** CHECK YOUR CONSOLE LOG ** for the actual field name from backend
                            storage: item.storage_location || item.storage || '', // Prioritize storage_location, fallback to storage, then empty
                            variant: item.variant || '',
                            status: item.status || 'Normal',
                        });
                    } else {
                        setError(`Item with ID ${id} not found.`);
                        console.warn(`ProductFormPage: Item with ID ${id} not found by backend.`);
                    }
                } catch (err) {
                    console.error("ProductFormPage: Error fetching item data:", err);
                    setError(`Failed to load item data: ${err.message}`);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchItemData();
        } else {
            // Reset form for 'new' page
            setFormData({
                name: '', sku: '', description: '', cost_price: '', quantity: '',
                category: '', storage: '', variant: '', status: 'Normal',
            });
            setConfirmDetails(false); // Also reset confirm checkbox for new items
            setIsLoading(false); // Ensure loading is false if not editing
        }
    }, [id, isEditing]); // Dependencies for useEffect

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            if (name === "confirmDetails") { // Ensure we only set confirmDetails for its specific checkbox
                setConfirmDetails(checked);
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleStatusClick = (newStatus) => {
        setFormData(prev => ({ ...prev, status: newStatus }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!confirmDetails) {
            setError('Please confirm the details before saving.');
            return;
        }
        if (!formData.name.trim()) {
            setError('Product Name is required.');
            return;
        }
        if (!formData.category) {
            setError('Product Category is required.');
            return;
        }
        if (!formData.storage) {
            setError('Storage Location is required.');
            return;
        }
        if (formData.cost_price === '' || isNaN(parseFloat(formData.cost_price)) || parseFloat(formData.cost_price) < 0) {
            setError('Valid Product Price is required (e.g., 60.00).');
            return;
        }
        if (formData.quantity === '' || isNaN(parseInt(formData.quantity, 10)) || parseInt(formData.quantity, 10) < 0) {
            setError('Valid Product Stock quantity is required (e.g., 100).');
            return;
        }


        setIsSubmitting(true);
        setError('');

        const itemDataToSave = {
            name: formData.name.trim(),
            sku: formData.sku.trim() || null,
            description: formData.description.trim() || null,
            cost_price: parseFloat(formData.cost_price) || 0.0,
            quantity: parseInt(formData.quantity, 10) || 0,
            category: formData.category,
            storage_location: formData.storage, // Maps frontend 'storage' to backend 'storage_location'
            variant: formData.variant.trim() || null,
            status: formData.status,
        };

        if (isEditing) {
            itemDataToSave.id = parseInt(id, 10); // Ensure ID is an integer if it's coming from URL params
        }

        console.log(`ProductFormPage: Attempting to ${isEditing ? 'update' : 'add'} item with data:`, JSON.stringify(itemDataToSave, null, 2));

        try {
            let result;
            if (isEditing) {
                result = await window.electronAPI.updateItem(itemDataToSave);
            } else {
                result = await window.electronAPI.addItem(itemDataToSave);
            }

            console.log(`ProductFormPage: Backend ${isEditing ? 'update' : 'add'} result:`, result);

            if (result && result.success) {
                setShowSuccessModal(true);
                // Do not reset form here for editing; navigation handles it.
                // For new items, navigation after modal close will also show a fresh page.
            } else {
                setError(`Failed to ${isEditing ? 'update' : 'add'} item: ${result ? result.message : 'Unknown backend error'}`);
            }
        } catch (err) {
            console.error(`ProductFormPage: Error during ${isEditing ? 'update' : 'add'} item:`, err);
            setError(`An error occurred: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        navigate('/products'); // Navigate back to list after closing modal
    };


    if (isLoading) { // Simplified loading check
        return <div className="page-container" style={{ padding: '2rem', textAlign: 'center' }}>Loading product details...</div>;
    }

    return (
        <div className="product-form-page page-container">
            <header className="page-header-alt">
                <div className="form-header-left">
                    <button onClick={() => navigate('/products')} className="back-button" aria-label="Go back to products list">
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1>{isEditing ? 'EDIT STOCK DETAILS' : 'NEW STOCK DETAILS'}</h1>
                        <p className="form-subtitle">
                            {isEditing ? 'Edit the product information below.' : 'Input all the product information below.'}
                        </p>
                    </div>
                </div>
            </header>

            {error && <div className="error-message card">Error: {error}</div>}

            <form onSubmit={handleSubmit} className="product-form card">
                 {/* Row 1: Category & Storage */}
                 <div className="form-row">
                     <div className="form-group form-group-inline">
                         <label htmlFor="category">Choose Product Category *</label>
                         <div className="input-with-icon">
                            <FaThLarge className="input-icon" />
                             <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                                 <option value="" disabled>Select Category</option>
                                 {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                             </select>
                         </div>
                     </div>
                     <div className="form-group form-group-inline">
                         <label htmlFor="storage">Choose Storage *</label>
                         <div className="input-with-icon">
                            <FaThLarge className="input-icon" />
                             <select id="storage" name="storage" value={formData.storage} onChange={handleChange} required>
                                 <option value="" disabled>Select Storage</option>
                                 {storageOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                         </div>
                     </div>
                 </div>

                 {/* Row 2: Name & Price */}
                 <div className="form-row">
                     <div className="form-group form-group-inline">
                         <label htmlFor="name">Product Name *</label>
                         <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., Kojic Soap" required />
                     </div>
                     <div className="form-group form-group-inline">
                         <label htmlFor="cost_price">Set Product Price *</label>
                         <input type="number" id="cost_price" name="cost_price" value={formData.cost_price} onChange={handleChange} min="0" step="0.01" placeholder="e.g., 60.00" required/>
                     </div>
                 </div>

                 {/* Row 3: Variant, Quantity, Status */}
                 <div className="form-row three-cols">
                     <div className="form-group form-group-inline">
                         <label htmlFor="variant">Product Variant (Optional)</label>
                         <input type="text" id="variant" name="variant" value={formData.variant} onChange={handleChange} placeholder="e.g., 135 grams" />
                     </div>
                     <div className="form-group form-group-inline">
                         <label htmlFor="quantity">Product Stock (Quantity) *</label>
                         <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} min="0" placeholder="e.g., 100" required />
                     </div>
                     <div className="form-group form-group-inline">
                         <label>Set Product Status</label>
                         <div className="status-buttons">
                             <button type="button" className={`status-btn high ${formData.status === 'High' ? 'active' : ''}`} onClick={() => handleStatusClick('High')}>High</button>
                             <button type="button" className={`status-btn normal ${formData.status === 'Normal' ? 'active' : ''}`} onClick={() => handleStatusClick('Normal')}>Normal</button>
                             <button type="button" className={`status-btn low ${formData.status === 'Low' ? 'active' : ''}`} onClick={() => handleStatusClick('Low')}>Low</button>
                         </div>
                     </div>
                 </div>

                 {/* Row 4: SKU */}
                 <div className="form-group">
                     <label htmlFor="sku">Product SKU Code (Optional)</label>
                     <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g., BIOSKIN-KS-135"/>
                 </div>

                 {/* Row 5: Description (Added based on formData) */}
                 <div className="form-group">
                    <label htmlFor="description">Product Description (Optional)</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Enter a brief description of the product..."
                    ></textarea>
                </div>


                {/* Row 6: Submit and Confirm */}
                <div className="form-footer">
                    <div className="confirm-checkbox">
                         <input
                            type="checkbox"
                            id="confirmDetails"
                            name="confirmDetails" // Added name attribute
                            checked={confirmDetails}
                            onChange={handleChange}
                         />
                         <label htmlFor="confirmDetails">I confirm all details of this product are correct.</label>
                     </div>
                     <div className="form-actions">
                         <button type="submit" className="button save-button" disabled={isSubmitting || !confirmDetails || isLoading}>
                             {isSubmitting ? 'Saving...' : (isEditing ? 'Update Product' : 'Save Product')}
                         </button>
                     </div>
                 </div>
            </form>

            {showSuccessModal && <SuccessModal onClose={handleCloseModal} />}
        </div>
    );
}

export default ProductFormPage;