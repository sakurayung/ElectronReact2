// src/AnalyticsPage.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // For navigation back
import {
  Chart as ChartJS,
  CategoryScale, // For X axis (labels)
  LinearScale,   // For Y axis (values)
  BarElement,    // For the bars themselves
  Title,         // For the chart title
  Tooltip,       // For hover tooltips
  Legend,        // For the legend (optional)
} from 'chart.js';
import { Bar } from 'react-chartjs-2'; // Import the Bar chart component

// Register the components Chart.js needs
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function AnalyticsPage() {
  const [summary, setSummary] = useState(null);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("AnalyticsPage: Fetching data...");
        // Fetch summary and low stock items concurrently
        const [summaryResult, lowStockResult] = await Promise.all([
          window.electronAPI.getInventorySummary(),
          window.electronAPI.getLowStockItems() // You can pass a threshold here if needed, e.g., getLowStockItems(5)
        ]);

        console.log("AnalyticsPage: Summary Result:", summaryResult);
        console.log("AnalyticsPage: Low Stock Result:", lowStockResult);

        // Check results and set state
        if (summaryResult.success) {
          setSummary(summaryResult.summary);
        } else {
          throw new Error(summaryResult.message || 'Failed to load summary');
        }

        if (lowStockResult.success) {
          setLowStockItems(lowStockResult.items);
        } else {
          throw new Error(lowStockResult.message || 'Failed to load low stock items');
        }

      } catch (err) {
        console.error("AnalyticsPage: Error fetching data:", err);
        setError(err.message);
        setSummary(null); // Clear data on error
        setLowStockItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means run once on mount

  // Helper to format currency
  const formatCurrency = (value) => {
    // Adjust currency symbol and formatting as needed (e.g., PHP)
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    // Or for PHP: return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
  };
  // Prepare data for the low stock bar chart
  const lowStockChartData = {
    labels: lowStockItems.map(item => item.name), // Item names for the X-axis labels
    datasets: [
      {
        label: 'Current Quantity', // Label for this dataset
        data: lowStockItems.map(item => item.quantity), // Quantities for the bar heights
        backgroundColor: 'rgba(220, 53, 69, 0.6)', // Reddish background (match --color-danger?)
        borderColor: 'rgba(220, 53, 69, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Optional: Configure chart options (title, axes, etc.)
  const lowStockChartOptions = {
    responsive: true, // Make it resize nicely
    plugins: {
      legend: {
        position: 'top', // Position the legend
      },
      title: {
        display: true,
        text: 'Low Stock Items (Quantity < 10)', // Chart title
      },
      tooltip: {
          callbacks: {
              label: function(context) {
                  // Customize tooltip text if needed
                  let label = context.dataset.label || '';
                  if (label) {
                      label += ': ';
                  }
                  if (context.parsed.y !== null) {
                      label += context.parsed.y + ' units';
                  }
                  return label;
              }
          }
      }
    },
    scales: {
      y: { // Y-axis configuration
        beginAtZero: true, // Start Y axis at 0
        title: {
          display: true,
          text: 'Quantity'
        }
      },
      x: { // X-axis configuration
          title: {
              display: true,
              text: 'Item Name'
          }
      }
    },
  };


  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <h1>Inventory Analytics</h1>
        <Link to="/" className="button button-secondary">Back to Inventory</Link>
      </header>

      <main style={{ marginTop: '2rem' }}>
        {isLoading && <p style={{ textAlign: 'center', padding: '2rem' }}>Loading analytics data...</p>}
        {error && <div className="card" style={{ color: 'red', padding: '1rem', marginBottom: '1rem' }}>Error: {error}</div>}

        {!isLoading && !error && (
          <>
            {/* Summary Section */}
            <section className="card" style={{ marginBottom: '2rem' }}>
              <h2>Inventory Summary</h2>
              {summary ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Total Unique Items:</strong> {summary.totalItems}</li>
                  <li style={{ marginBottom: '0.5rem' }}><strong>Total Stock Quantity:</strong> {summary.totalQuantity} units</li>
                  <li><strong>Estimated Total Value:</strong> {formatCurrency(summary.totalValue)}</li>
                </ul>
              ) : (
                <p>Could not load summary data.</p>
              )}
            </section>



            {/* Low Stock Section - Now with Chart */}
            <section className="card">
              {/* Keep the title if you want */}
              {/* <h2>Low Stock Items (Quantity < 10)</h2> */}

              {lowStockItems.length > 0 ? (
                // Render the Bar chart if there's data
                <Bar options={lowStockChartOptions} data={lowStockChartData} />
              ) : (
                // Show message if no low stock items
                <>
                    <h2>{`Items with Quantity < 10`}</h2>
                    <p>No items found with stock quantity less than 10.</p>
                </>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AnalyticsPage;