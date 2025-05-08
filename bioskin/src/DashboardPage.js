// src/DashboardPage.js
import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import {
    FaBoxOpen, FaShoppingCart, FaArrowDown, FaClipboardList,
    FaChartLine, FaBan, FaExclamationTriangle, FaBell, FaUserCircle
} from 'react-icons/fa';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler // <<< --- IMPORT FILLER HERE
} from 'chart.js';

// Register the components Chart.js needs, ADD Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler // <<< --- REGISTER FILLER HERE
);

// (Keep ChartJS.register if you use the Bar chart)

const formatCurrency = (value, currency = 'PHP') => { // Default to PHP
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: currency }).format(value || 0);
};

function DashboardPage() {
  // (Keep your existing state variables: summary, ordersToday, revenueToday, etc.)
  // ... (useState and useEffect for data fetching remain largely the same) ...
  // For example:
  const [summary, setSummary] = useState({ totalItems: 0, totalQuantity: 0, totalValue: 0 });
  const [todaysSalesValue, setTodaysSalesValue] = useState(13100); // Placeholder from image
  const [itemsInLowStock, setItemsInLowStock] = useState(7); // Placeholder
  const [newOrdersCount, setNewOrdersCount] = useState(23); // Placeholder

  const [topSellingProducts, setTopSellingProducts] = useState([]); // For the chart
  const [activityLog, setActivityLog] = useState([]); // Placeholder

  const [isLoading, setIsLoading] = useState(true); // Set to false if using placeholders initially
  const [error, setError] = useState(null);

  // Placeholder useEffect for chart and activity log
  useEffect(() => {
    // Simulate fetching data
    setIsLoading(true);
    // In a real app, fetch summary, sales, low stock, new orders, top selling, activity log
    // For now, using placeholders set in useState. Let's simulate fetching summary for consistency
    const fetchCoreData = async () => {
        try {
            const summaryResult = await window.electronAPI.getInventorySummary();
            if (summaryResult.success) {
              setSummary(summaryResult.summary);
            } else {
              console.error("Dashboard: Failed to load inventory summary", summaryResult.message);
            }
            // TODO: Fetch other dynamic data points (todaysSalesValue, itemsInLowStock, newOrdersCount)
            // For now, they use placeholders.
        } catch (err) {
            setError("Failed to load dashboard data.");
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    fetchCoreData();


    // Placeholder for Top Selling Products Chart Data
    setTopSellingProducts({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Skincare',
                data: [65, 59, 80, 81, 56, 55, 40, 50, 60, 70, 75, 90].map(d => d + Math.random()*10),
                borderColor: '#81D4FA', // Light Blue
                backgroundColor: 'rgba(129, 212, 250, 0.1)',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Wellness',
                data: [28, 48, 40, 19, 86, 27, 90, 70, 65, 50, 40, 55].map(d => d + Math.random()*10),
                borderColor: '#FFAB91', // Light Orange/Peach
                backgroundColor: 'rgba(255, 171, 145, 0.1)',
                tension: 0.4,
                fill: true,
            },
            {
                label: 'Cosmetics',
                data: [35, 20, 50, 60, 45, 70, 60, 80, 70, 55, 65, 70].map(d => d + Math.random()*10),
                borderColor: '#CE93D8', // Light Purple
                backgroundColor: 'rgba(206, 147, 216, 0.1)',
                tension: 0.4,
                fill: true,
            }
        ],
    });

    // Placeholder for Activity Log
    setActivityLog([
        { id: 1, time: '10:32 AM', user: 'Admin', action: 'Updated stock for Kojic Acid.' },
        { id: 2, time: '09:15 AM', user: 'Employee A', action: 'Added new item: Vitamin C Serum.' },
        { id: 3, time: 'Yesterday', user: 'Admin', action: 'Generated monthly sales report.' },
    ]);
    // setIsLoading(false); // If all data is placeholder
  }, []);


  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'var(--color-text-medium)'} },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true, ticks: { color: 'var(--color-text-light)'}, grid: { color: 'var(--color-border-soft)'} },
      x: { ticks: { color: 'var(--color-text-light)'}, grid: { color: 'var(--color-border-soft)'} },
    },
  };

  if (isLoading) return <div className="container page-container"><p style={{textAlign: 'center', padding: '2rem'}}>Loading dashboard...</p></div>;
  if (error) return <div className="container page-container card" style={{color: 'var(--color-status-danger)', padding: '1rem'}}>Error: {error}</div>;

  return (
    <div className="dashboard-layout"> {/* New wrapper for 2-column layout */}
        <div className="dashboard-main-content container page-container">
          <header className="dashboard-header">
            <div>
                <h1 className="welcome-title">WELCOME ADMIN!</h1>
                <p className="welcome-subtitle">BIOSKIN INVENTORY</p>
            </div>
            <div className="top-bar-icons">
                <FaBell />
                <FaUserCircle />
            </div>
          </header>

          {/* Stat Cards Section */}
          <div className="stat-cards-grid">
            <div className="card stat-card"> {/* Use .card for base style */}
              <div className="stat-content">
                <div className="stat-icon total-products"><FaBoxOpen /></div>
                <div className="stat-info">
                  <p>total products</p>
                  {/* Use summary.totalItems from your actual data */}
                  <span>{summary.totalItems || 200}</span>
                </div>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-content">
                <div className="stat-icon todays-sales">₱</div> {/* Or use an icon */}
                <div className="stat-info">
                  <p>today's sales</p>
                  <span>{formatCurrency(todaysSalesValue)}</span>
                </div>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-content">
                <div className="stat-icon in-low-stock"><FaArrowDown/></div>
                <div className="stat-info">
                  <p>in low stock</p>
                  <span>{itemsInLowStock} items</span>
                </div>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-content">
                <div className="stat-icon new-orders"><FaClipboardList /></div>
                <div className="stat-info">
                  <p>new orders</p>
                  <span>{newOrdersCount} items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="card info-card chart-container">
            <h3>Top Selling Products by Category</h3>
            <div style={{ height: '300px' }}> {/* Set explicit height for chart parent */}
                {topSellingProducts.datasets && <Bar options={chartOptions} data={topSellingProducts} />}
            </div>
          </div>
        </div>

        {/* Activity Log Panel */}
        <aside className="activity-log-panel card">
            <h3>Activity Log</h3>
            {activityLog.length > 0 ? (
                <ul>
                    {activityLog.map(log => (
                        <li key={log.id}>
                            <span className="log-time">{log.time}</span>
                            <span className="log-user">{log.user}:</span>
                            <span className="log-action">{log.action}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="no-data-message">No recent activity.</p>
            )}
        </aside>
    </div>
  );
}
export default DashboardPage;