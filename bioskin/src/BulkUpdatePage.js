// src/BulkUpdatePage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function BulkUpdatePage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [actionType, setActionType] = useState('add'); // 'add', 'deduct', 'set'
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null); // To store results from backend
    const [error, setError] = useState('');

    // --- Define expected column names ---
    // IMPORTANT: User's file MUST have headers matching these (for CSV)
    // Or these names should correspond to the columns you expect (for XLSX)
    const columnMapping = {
        sku: 'SKU', // Header name for SKU column
        quantity: 'Quantity' // Header name for Quantity column
    };
    // --- ---

    const handleFileChange = (event) => {
        setResult(null); // Clear previous results
        setError('');
        const file = event.target.files[0];
        if (file) {
            // Basic validation (can add more specific type checks)
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
                setError('Invalid file type. Please upload a .xlsx or .csv file.');
                setSelectedFile(null);
                event.target.value = null; // Clear the input
                return;
            }
            setSelectedFile(file);
        } else {
            setSelectedFile(null);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!selectedFile) {
            setError('Please select a file to upload.');
            return;
        }
        if (!actionType) {
            setError('Please select an action type.');
            return;
        }

        setIsLoading(true);
        setError('');
        setResult(null);

        // Read file content as Base64
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile); // Reads as data:....;base64,.....

        reader.onload = async () => {
            try {
                const base64Content = reader.result.split(',')[1]; // Get only the base64 part
                const fileData = {
                    name: selectedFile.name,
                    type: selectedFile.type,
                    contentBase64: base64Content
                };

                console.log("BulkUpdatePage: Sending file to backend for processing...");
                const backendResult = await window.electronAPI.processInventoryFile({
                    fileData,
                    actionType,
                    columnMapping // Send mapping info
                });
                console.log("BulkUpdatePage: Backend Result:", backendResult);
                setResult(backendResult); // Store the result object

            } catch (err) {
                console.error("BulkUpdatePage: Error processing file:", err);
                setError(`An error occurred: ${err.message}`);
                setResult(null);
            } finally {
                setIsLoading(false);
            }
        };

        reader.onerror = (error) => {
            console.error("FileReader error:", error);
            setError('Failed to read the selected file.');
            setIsLoading(false);
        };
    };

    return (
        <div className="container">
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                <h1>Bulk Inventory Update</h1>
                <Link to="/" className="button button-secondary">Back to Inventory</Link>
            </header>

            <main style={{ marginTop: '2rem' }}>
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                            Upload an Excel (.xlsx) or CSV (.csv) file to update inventory quantities. <br />
                            The file must contain columns with headers:
                            <strong style={{ color: 'var(--color-primary)' }}> "{columnMapping.sku}" </strong>
                            and
                            <strong style={{ color: 'var(--color-primary)' }}> "{columnMapping.quantity}"</strong>.
                        </p>

                        <div className="form-group">
                            <label htmlFor="inventoryFile">Select File (.xlsx or .csv):</label>
                            <input
                                type="file"
                                id="inventoryFile"
                                accept=".xlsx, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, text/csv"
                                onChange={handleFileChange}
                                required
                                style={{
                                    display: 'block', // Make it block for better spacing
                                    width: '100%',
                                    padding: 'var(--spacing-unit)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--border-radius)'
                                 }}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="actionType">Action Type:</label>
                            <select
                                id="actionType"
                                value={actionType}
                                onChange={(e) => setActionType(e.target.value)}
                                required
                                style={{ // Basic styling for select
                                    display: 'block',
                                    width: '100%',
                                    padding: 'calc(var(--spacing-unit) * 1.5)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--border-radius)',
                                    fontSize: 'var(--font-size-base)',
                                    backgroundColor: '#fff'
                                }}
                            >
                                <option value="add">Add Quantity (File Qty + Current Qty)</option>
                                <option value="deduct">Deduct Quantity (Current Qty - File Qty)</option>
                                <option value="set">Set Quantity (Current Qty = File Qty)</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="button button-primary" disabled={isLoading || !selectedFile}>
                                {isLoading ? 'Processing...' : 'Process File'}
                            </button>
                        </div>
                    </form>

                    {/* Display Results */}
                    {isLoading && <p style={{ marginTop: '1rem', textAlign: 'center' }}>Processing file, please wait...</p>}
                    {error && <div className="card" style={{ color: 'red', padding: '1rem', marginTop: '1rem' }}>Error: {error}</div>}
                    {result && (
                        <div className="card" style={{ marginTop: '2rem', backgroundColor: result.success ? '#eaf7ec' : '#fdecea' }}>
                            <h3>Processing Results</h3>
                            <p>File: {selectedFile?.name}</p>
                            <p>Total Rows Processed: {result.processedCount ?? 'N/A'}</p>
                            <p>Successfully Updated: {result.successCount ?? 'N/A'}</p>
                            <p>Errors: {result.errors?.length ?? 0}</p>
                            {result.errors && result.errors.length > 0 && (
                                <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '0.5rem', background: '#fff' }}>
                                    <strong>Error Details:</strong>
                                    <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                                        {result.errors.map((errMsg, index) => (
                                            <li key={index} style={{ marginBottom: '0.25rem', fontSize: '0.9em' }}>{errMsg}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default BulkUpdatePage;