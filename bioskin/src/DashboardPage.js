// src/DashboardPage.js
import React, { useState, useEffect } from 'react';
import './DashboardPage.css';
import {
    FaChartLine,
    FaBell, FaUserCircle,
    FaPumpSoap,
    FaClipboardList,
    FaArrowDown // Corrected: Using FaArrowDown for low stock
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register the components Chart.js needs for Line chart
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const formatCurrency = (value, currency = 'PHP') => {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);
};

function DashboardPage() {
  const [summary, setSummary] = useState({ totalItems: 200, totalQuantity: 0, totalValue: 0 });
  const [todaysSalesValue, setTodaysSalesValue] = useState(13100);
  const [itemsInLowStock, setItemsInLowStock] = useState(7);
  const [newOrdersCount, setNewOrdersCount] = useState(23);

  const [topSellingProductsData, setTopSellingProductsData] = useState({});
  const [activityLog, setActivityLog] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    const fetchCoreData = async () => {
        try {
            // Simulate fetching summary
        } catch (err) {
            setError("Failed to load dashboard data.");
            console.error(err);
        } finally {
            // setIsLoading(false);
        }
    };
    fetchCoreData();

    setTopSellingProductsData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
            {
                label: 'Skincare',
                data: [65, 59, 80, 81, 56, 55, 40, 50, 60, 70, 75, 90].map(d => d + Math.random()*5),
                borderColor: '#81D4FA',
                backgroundColor: 'rgba(129, 212, 250, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#81D4FA',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#81D4FA',
            },
            {
                label: 'Wellness',
                data: [28, 48, 40, 19, 86, 27, 90, 70, 65, 50, 40, 55].map(d => d + Math.random()*5),
                borderColor: '#FFAB91',
                backgroundColor: 'rgba(255, 171, 145, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#FFAB91',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#FFAB91',
            },
            {
                label: 'Cosmetics',
                data: [35, 20, 50, 60, 45, 70, 60, 80, 70, 55, 65, 70].map(d => d + Math.random()*5),
                borderColor: '#CE93D8',
                backgroundColor: 'rgba(206, 147, 216, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#CE93D8',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#CE93D8',
            }
        ],
    });

    setActivityLog([
        { id: 1, time: '10:32 AM', user: 'Admin', action: 'Updated stock for Kojic Acid.' },
        { id: 2, time: '09:15 AM', user: 'Employee A', action: 'Added new item: Vitamin C Serum.' },
        { id: 3, time: 'Yesterday', user: 'Admin', action: 'Generated monthly sales report.' },
        { id: 4, time: '2 days ago', user: 'System', action: 'Low stock warning for Product X.' },
    ]);
    setIsLoading(false);
  }, []);


  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
            color: 'var(--color-text-medium)',
            usePointStyle: true,
            boxWidth: 8,
            padding: 20
        }
      },
      title: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        titleFont: { size: 14 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: 'var(--color-text-light)'},
        grid: { color: 'var(--color-border-soft)'}
      },
      x: {
        ticks: { color: 'var(--color-text-light)'},
        grid: { display: false }
      },
    },
    elements: {
        line: {
            borderWidth: 2
        },
        point: {
            radius: 4,
            hoverRadius: 6
        }
    }
  };

  if (isLoading) return <div className="container page-container"><p style={{textAlign: 'center', padding: '2rem'}}>Loading dashboard...</p></div>;
  if (error) return <div className="container page-container card" style={{color: 'var(--color-status-danger)', padding: '1rem'}}>Error: {error}</div>;

  return (
    <div className="dashboard-layout">
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

          <div className="stat-cards-grid">
            <div className="card stat-card">
              <div className="stat-icon icon-total-products"><FaPumpSoap /></div>
              <div className="stat-info">
                <span>{summary.totalItems}</span>
                <p>total products</p>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon icon-todays-sales">₱</div>
              <div className="stat-info">
                <span>{todaysSalesValue / 1000}k</span>
                <p>today's sales</p>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon icon-new-orders"><FaClipboardList /></div>
              <div className="stat-info">
                <span>{newOrdersCount} items</span>
                <p>new orders</p>
              </div>
            </div>
            <div className="card stat-card">
              <div className="stat-icon icon-low-stock"><FaArrowDown /></div> {/* Corrected Icon Usage */}
              <div className="stat-info">
                <span>{itemsInLowStock} items</span>
                <p>in low stock</p>
              </div>
            </div>
          </div>

          <div className="card info-card chart-container">
            <h3>Top Selling Products by Category</h3>
            <div style={{ height: '350px' }}>
                {topSellingProductsData.datasets && <Line options={lineChartOptions} data={topSellingProductsData} />}
            </div>
          </div>
        </div>

        <aside className="activity-log-panel card">
            <h3>Activity Log</h3>
            {activityLog.length > 0 ? (
                <ul>
                    {activityLog.map(log => (
                        <li key={log.id}>
                            <span className="log-time">{log.time}</span>
                            <div>
                                <span className="log-user">{log.user}:</span>
                                <span className="log-action">{log.action}</span>
                            </div>
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