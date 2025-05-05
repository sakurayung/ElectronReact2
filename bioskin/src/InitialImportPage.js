// src/InitialImportPage.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function InitialImportPage() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

   // --- Define CORRECTED expected column names/order ---
   const expectedColumns = ['SKU', 'Name', 'Description', 'Cost', 'Quantity'];
   // --- ---
    // --- ---

    const handleFileChange = (event) => {
        setResult(null);
        setError('');
        const file = event.target.files[0];
        if (file) {
            if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv')) {
                setError('Invalid file type. Please upload a .xlsx or .csv file.');
                setSelectedFile(null);
                event.target.value = null;
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

        setIsLoading(true);
        setError('');
        setResult(null);

        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);

        reader.onload = async () => {
            try {
                const base64Content = reader.result.split(',')[1];
                const fileData = {
                    name: selectedFile.name,
                    type: selectedFile.type,
                    contentBase64: base64Content
                };

                console.log("InitialImportPage: Sending file to backend for initial import...");
                const backendResult = await window.electronAPI.importInitialItems({ fileData });
                console.log("InitialImportPage: Backend Result:", backendResult);
                setResult(backendResult);

            } catch (err) {
                console.error("InitialImportPage: Error processing file:", err);
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
                <h1>Initial Item Import</h1>
                <Link to="/" className="button button-secondary">Back to Inventory</Link>
            </header>

            <main style={{ marginTop: '2rem' }}>
                <div className="card">
                    <form onSubmit={handleSubmit}>
                        <h3 style={{ marginTop: 0 }}>Import New Items</h3>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-muted)' }}>
                           Upload an Excel (.xlsx) or CSV (.csv) file to add multiple new items to the inventory system. <br />
                           The file's first row should contain headers, and the data must include columns for: <br />
                           {/* Update the displayed columns */}
                           <strong style={{ color: 'var(--color-primary)' }}>{expectedColumns.join(', ')}</strong>. <br/>
                           <span style={{fontWeight: 'bold'}}>Note:</span> SKU and Name are required and SKUs must be unique. Items with existing SKUs will be skipped. Description is optional. Cost and Quantity default to 0 if invalid or missing.
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
                                    display: 'block', width: '100%', padding: 'var(--spacing-unit)',
                                    border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius)'
                                 }}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="button button-primary" disabled={isLoading || !selectedFile}>
                                {isLoading ? 'Importing...' : 'Import Items'}
                            </button>
                        </div>
                    </form>

                    {/* Display Results */}
                    {isLoading && <p style={{ marginTop: '1rem', textAlign: 'center' }}>Importing items, please wait...</p>}
                    {error && <div className="card" style={{ color: 'red', padding: '1rem', marginTop: '1rem' }}>Error: {error}</div>}
                    {result && (
                        <div className="card" style={{ marginTop: '2rem', backgroundColor: result.success ? '#eaf7ec' : '#fdecea' }}>
                            <h3>Import Results</h3>
                            <p>File: {selectedFile?.name}</p>
                            <p>Total Rows Processed: {result.processedCount ?? 'N/A'}</p>
                            <p>Successfully Imported: {result.successCount ?? 'N/A'}</p>
                            <p>Errors/Skipped: {result.errors?.length ?? 0}</p>
                            {result.errors && result.errors.length > 0 && (
                                <div style={{ marginTop: '1rem', maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--color-border)', padding: '0.5rem', background: '#fff' }}>
                                    <strong>Error/Skipped Details:</strong>
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

export default InitialImportPage;