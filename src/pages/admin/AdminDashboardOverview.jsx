import { useState, useEffect } from 'react';
import { apiGet } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './AdminDashboardOverview.css';

export default function AdminDashboardOverview() {
    const [stats, setStats] = useState(null);
    const [auditLogs, setAuditLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showError } = useToast();

    // REQ-38: Date range filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async (start, end) => {
        try {
            setIsLoading(true);
            let statsUrl = '/dashboard/stats';
            const params = [];
            if (start) params.push(`startDate=${start}`);
            if (end) params.push(`endDate=${end}`);
            if (params.length > 0) statsUrl += '?' + params.join('&');

            const [statsData, logsData] = await Promise.all([
                apiGet(statsUrl),
                apiGet('/dashboard/audit-logs')
            ]);
            setStats(statsData);
            setAuditLogs(logsData);
        } catch (err) {
            showError('Failed to load dashboard data: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    function handleFilterRevenue() {
        fetchData(startDate, endDate);
    }

    function handleClearFilter() {
        setStartDate('');
        setEndDate('');
        fetchData('', '');
    }

    // REQ-40: CSV export of orders data
    function handleExportCSV() {
        if (!stats || !stats.topCustomers) return;
        
        const headers = ['Customer Name', 'Email', 'Orders', 'Total Spent'];
        const rows = stats.topCustomers.map(c => [c.name, c.email, c.orderCount, c.totalSpent]);
        
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendora_top_customers_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    if (isLoading || !stats) {
        return (
            <div className="admin-page container">
                <h2>Dashboard Overview</h2>
                <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner /></div>
            </div>
        );
    }

    return (
        <div className="admin-page container animate-fade-in">
            <header className="admin-header">
                <h2>📊 Dashboard Overview</h2>
                <p>Real-time statistics and system audit logs.</p>
            </header>

            {/* REQ-38: Date range filter for revenue */}
            <div className="date-filter">
                <label className="date-filter__label">Revenue Period:</label>
                <input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)}
                    className="date-filter__input"
                />
                <span className="date-filter__separator">to</span>
                <input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)}
                    className="date-filter__input"
                />
                <button className="date-filter__btn" onClick={handleFilterRevenue}>
                    Apply Filter
                </button>
                {(startDate || endDate) && (
                    <button className="date-filter__clear" onClick={handleClearFilter}>
                        Clear
                    </button>
                )}
            </div>

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-card__title">
                        Total Revenue
                        {stats.dateFiltered && <span className="kpi-card__badge">Filtered</span>}
                    </div>
                    <div className="kpi-card__value">{formatCurrency(stats.totalRevenue)}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-card__title">New Orders Today</div>
                    <div className="kpi-card__value">{stats.newOrdersToday}</div>
                </div>
                <div className="kpi-card">
                    <div className="kpi-card__title">Registered Customers</div>
                    <div className="kpi-card__value">{stats.totalCustomers}</div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Top Customers */}
                <div className="dashboard-panel">
                    <div className="dashboard-panel__header">
                        <h3>🏆 Top 5 Customers</h3>
                        <button className="export-btn" onClick={handleExportCSV} title="Export as CSV">
                            📥 Export CSV
                        </button>
                    </div>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Orders</th>
                                <th>Total Spent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats.topCustomers.length === 0 ? (
                                <tr><td colSpan="3" style={{textAlign: 'center'}}>No customer data.</td></tr>
                            ) : (
                                stats.topCustomers.map(customer => (
                                    <tr key={customer.userId}>
                                        <td>
                                            <div>{customer.name}</div>
                                            <small style={{color: 'var(--color-gray-500)'}}>{customer.email}</small>
                                        </td>
                                        <td>{customer.orderCount}</td>
                                        <td style={{fontWeight: 'bold', color: 'var(--color-primary)'}}>
                                            {formatCurrency(customer.totalSpent)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* REQ-39: Top Selling Products */}
                <div className="dashboard-panel">
                    <h3>🔥 Top Selling Products</h3>
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Units Sold</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!stats.topProducts || stats.topProducts.length === 0) ? (
                                <tr><td colSpan="3" style={{textAlign: 'center'}}>No sales data yet.</td></tr>
                            ) : (
                                stats.topProducts.map(product => (
                                    <tr key={product.productId}>
                                        <td>{product.productName}</td>
                                        <td>{product.totalSold}</td>
                                        <td style={{fontWeight: 'bold', color: 'var(--color-primary)'}}>
                                            {formatCurrency(product.totalRevenue)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Audit Logs */}
            <div className="dashboard-panel" style={{ marginTop: 'var(--space-6)' }}>
                <h3>🛡️ Security Audit Logs</h3>
                <div className="audit-log-list">
                    {auditLogs.length === 0 ? (
                        <p style={{textAlign: 'center', padding: '1rem', color: 'var(--color-gray-500)'}}>No recent activity.</p>
                    ) : (
                        auditLogs.map(log => (
                            <div key={log.id} className="audit-log-item">
                                <div className="audit-log-item__header">
                                    <span className={`log-action action-${log.actionType.toLowerCase()}`}>
                                        {log.actionType}
                                    </span>
                                    <span className="log-time">{formatDate(log.timestamp)}</span>
                                </div>
                                <div className="audit-log-item__body">
                                    <strong>{log.adminName}</strong> performed action on <strong>{log.targetTable}</strong> (ID: {log.targetId})
                                </div>
                                {log.details && (
                                    <div className="audit-log-item__details">
                                        {log.details}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
