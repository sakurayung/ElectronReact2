// src/ProductFormPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaBell, FaUserCircle, FaThLarge } from 'react-icons/fa'; // Add FaThLarge
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
        description: '', // Assuming description is needed, though not shown
        cost_price: '',
        quantity: '',
        category: '', // New field
        storage: '',  // New field
        variant: '',  // New field
        status: 'Normal', // New field: High, Normal, Low
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmDetails, setConfirmDetails] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    // Placeholder data for dropdowns
    const categories = ["Beauty Soap", "Skincare", "Wellness", "Cosmetics"];
    const storageOptions = ["STORE", "Main Warehouse", "Online Fulfillment"];

    useEffect(() => {
        if (isEditing) {
            const fetchItemData = async () => {
                setIsLoading(true);
                setError('');
                try {
                    const item = await window.electronAPI.getItemById(id);
                    if (item) {
                        setFormData({
                            name: item.name || '',
                            sku: item.sku || '',
                            description: item.description || '',
                            cost_price: item.cost_price !== null ? String(item.cost_price) : '',
                            quantity: item.quantity !== null ? String(item.quantity) : '',
                            category: item.category || '', // Populate if data exists
                            storage: item.storage || '',   // Populate if data exists
                            variant: item.variant || '',   // Populate if data exists
                            status: item.status || 'Normal', // Populate if data exists
                        });
                    } else {
                        setError(`Item with ID ${id} not found.`);
                    }
                } catch (err) {
                    setError(`Failed to load item data: ${err.message}`);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchItemData();
        } else {
            // Reset form for 'new' page if needed (though default state handles it)
            setFormData({
                name: '', sku: '', description: '', cost_price: '', quantity: '',
                category: '', storage: '', variant: '', status: 'Normal',
            });
        }
    }, [id, isEditing]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setConfirmDetails(checked);
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
        if (!formData.name) { // Add other basic validations
            setError('Product Name is required.');
            return;
        }

        setIsSubmitting(true);
        setError('');

        // Prepare data for backend (parse numbers, handle potential new fields)
        const itemDataToSave = {
            ...formData,
            cost_price: parseFloat(formData.cost_price) || 0.0,
            quantity: parseInt(formData.quantity, 10) || 0,
            // Ensure backend expects category, storage, variant, status if sending
        };
        // Remove ID if not editing
        if (!isEditing) {
            delete itemDataToSave.id;
        } else {
            itemDataToSave.id = id;
        }


        try {
            let result;
            if (isEditing) {
                console.log('Updating item:', itemDataToSave);
                result = await window.electronAPI.updateItem(itemDataToSave);
            } else {
                console.log('Adding item:', itemDataToSave);
                result = await window.electronAPI.addItem(itemDataToSave);
            }

            if (result.success) {
                setShowSuccessModal(true); // Show success modal
                // Reset form state? Optional, depends on if user adds multiple quickly
                // setConfirmDetails(false);
                // setFormData({ name: '', sku: '', ... });
                // Navigation happens after modal close
            } else {
                setError(`Failed to ${isEditing ? 'update' : 'add'} item: ${result.message || 'Backend error'}`);
            }
        } catch (err) {
            setError(`An error occurred: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        setShowSuccessModal(false);
        navigate('/products'); // Navigate back to list after closing modal
    };


    if (isLoading && isEditing) {
        return <div className="page-container"><p>Loading item details...</p></div>;
    }

    return (
        <div className="product-form-page page-container">
            <header className="page-header-alt">
                <div className="form-header-left">
                    <button onClick={() => navigate('/products')} className="back-button">
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1>{isEditing ? 'EDIT STOCK DETAILS' : 'NEW STOCK DETAILS'}</h1>
                        <p className="form-subtitle">
                            {isEditing ? 'Edit the product information below.' : 'Input all the product information below.'}
                        </p>
                    </div>
                </div>
                <div className="top-bar-icons">
                    <FaBell />
                    <FaUserCircle />
                </div>
            </header>

            {error && <div className="error-message card">{/* Style appropriately */}Error: {error}</div>}

            <form onSubmit={handleSubmit} className="product-form card">
                 {/* Row 1: Category & Storage */}
                 <div className="form-row">
                     <div className="form-group form-group-inline">
                         <label htmlFor="category">Choose Product Category</label>
                         <div className="input-with-icon">
                            <FaThLarge className="input-icon" />
                             <select id="category" name="category" value={formData.category} onChange={handleChange} required>
                                 <option value="" disabled>Select Category</option>
                                 {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                             </select>
                         </div>
                     </div>
                     <div className="form-group form-group-inline">
                         <label htmlFor="storage">Choose Storage</label>
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
                         <label htmlFor="name">Product Name</label>
                         <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                     </div>
                     <div className="form-group form-group-inline">
                         <label htmlFor="cost_price">Set Product Price</label>
                         <input type="number" id="cost_price" name="cost_price" value={formData.cost_price} onChange={handleChange} min="0" step="0.01" placeholder="e.g., 60.00" required/>
                     </div>
                 </div>

                 {/* Row 3: Variant, Quantity, Status */}
                 <div className="form-row three-cols">
                     <div className="form-group form-group-inline">
                         <label htmlFor="variant">Product Variant</label>
                         <input type="text" id="variant" name="variant" value={formData.variant} onChange={handleChange} placeholder="e.g., 135 grams" />
                     </div>
                     <div className="form-group form-group-inline">
                         <label htmlFor="quantity">Product Stock (Quantity)</label>
                         <input type="number" id="quantity" name="quantity" value={formData.quantity} onChange={handleChange} min="0" required />
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
                     <label htmlFor="sku">Product SKU Code</label>
                     <input type="text" id="sku" name="sku" value={formData.sku} onChange={handleChange} />
                 </div>

                {/* Row 5: Submit and Confirm */}
                <div className="form-footer">
                    <div className="confirm-checkbox">
                         <input
                            type="checkbox"
                            id="confirmDetails"
                            checked={confirmDetails}
                            onChange={handleChange}
                         />
                         <label htmlFor="confirmDetails">Confirm Details of this Product</label>
                     </div>
                     <div className="form-actions">
                         <button type="submit" className="button save-button" disabled={isSubmitting || !confirmDetails}>
                             {isSubmitting ? 'Saving...' : 'Save Product'}
                         </button>
                     </div>
                 </div>
            </form>

            {showSuccessModal && <SuccessModal onClose={handleCloseModal} />}
        </div>
    );
}

export default ProductFormPage;