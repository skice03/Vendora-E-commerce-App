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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const statsData = await apiGet('/dashboard/stats');
            const logsData = await apiGet('/dashboard/audit-logs');
            setStats(statsData);
            setAuditLogs(logsData);
        } catch (err) {
            showError('Failed to load dashboard data: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

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

            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card">
                    <div className="kpi-card__title">Total Revenue</div>
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
                    <h3>🏆 Top 5 Customers</h3>
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

                {/* Audit Logs */}
                <div className="dashboard-panel">
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
        </div>
    );
}
