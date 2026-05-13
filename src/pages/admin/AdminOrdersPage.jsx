import { useState, useEffect } from 'react';
import { apiGet, apiPut, apiPost } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatCurrency, formatDate } from '../../utils/formatters.js';
import Spinner from '../../components/ui/Spinner.jsx';
import './AdminOrdersPage.css';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showSuccess, showError } = useToast();
    const [selectedOrder, setSelectedOrder] = useState(null); // For modal

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const data = await apiGet('/orders');
            setOrders(data);
        } catch (err) {
            showError('Failed to load orders: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await apiPut(`/orders/${orderId}/status`, { status: newStatus });
            showSuccess(`Order #${orderId} status updated to ${newStatus}`);
            fetchOrders(); // refresh
        } catch (err) {
            showError('Failed to update status: ' + err.message);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (!window.confirm(`Are you sure you want to cancel order #${orderId}? This will restock the items.`)) return;
        
        try {
            await apiPost(`/orders/${orderId}/cancel`);
            showSuccess(`Order #${orderId} cancelled successfully.`);
            fetchOrders(); // refresh
        } catch (err) {
            showError('Failed to cancel order: ' + err.message);
        }
    };

    if (isLoading) {
        return (
            <div className="admin-page container">
                <h2>Manage Orders</h2>
                <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner /></div>
            </div>
        );
    }

    return (
        <div className="admin-page container animate-fade-in">
            <header className="admin-header">
                <h2>📦 Order Management</h2>
                <p>View and update customer orders.</p>
            </header>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr><td colSpan="6" style={{textAlign: 'center'}}>No orders found.</td></tr>
                        ) : (
                            orders.map(order => (
                                <tr key={order.id}>
                                    <td>#{order.id}</td>
                                    <td>{formatDate(order.createdAt)}</td>
                                    <td>
                                        <div>{order.customerName}</div>
                                        <small style={{ color: 'var(--color-gray-500)' }}>{order.customerEmail}</small>
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>{formatCurrency(order.totalAmount)}</td>
                                    <td>
                                        <select 
                                            value={order.status} 
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            disabled={order.status === 'Cancelled'}
                                            className={`status-select status-${order.status.toLowerCase()}`}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Shipped">Shipped</option>
                                            <option value="Delivered">Delivered</option>
                                            <option value="Cancelled" disabled>Cancelled</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="admin-actions">
                                            <button 
                                                className="btn-icon btn-view" 
                                                onClick={() => setSelectedOrder(order)}
                                                title="View Details"
                                            >
                                                👁️
                                            </button>
                                            {order.status !== 'Cancelled' && (
                                                <button 
                                                    className="btn-icon btn-delete" 
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    title="Cancel Order"
                                                >
                                                    ❌
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Order #{selectedOrder.id} Details</h3>
                            <button className="modal-close" onClick={() => setSelectedOrder(null)} aria-label="Close">×</button>
                        </div>
                        <div className="modal-body">
                            <div className="order-details-grid">
                                <div>
                                    <h4>Customer Information</h4>
                                    <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                                    <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                                    <p><strong>Shipping Address:</strong> {selectedOrder.shippingAddress}</p>
                                    {/* REQ-74: Customer profile accessible from order details */}
                                    {selectedOrder.customerSince && (
                                        <p><strong>Member Since:</strong> {formatDate(selectedOrder.customerSince)}</p>
                                    )}
                                    {selectedOrder.customerOrderCount > 0 && (
                                        <p><strong>Total Orders:</strong> {selectedOrder.customerOrderCount}</p>
                                    )}
                                    {selectedOrder.customerTotalSpent > 0 && (
                                        <p><strong>Lifetime Spend:</strong> {formatCurrency(selectedOrder.customerTotalSpent)}</p>
                                    )}
                                </div>
                                <div>
                                    <h4>Order Information</h4>
                                    <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                                    <p><strong>Status:</strong> <span className={`badge badge-${selectedOrder.status.toLowerCase()}`}>{selectedOrder.status}</span></p>
                                    <p><strong>Total Amount:</strong> {formatCurrency(selectedOrder.totalAmount)}</p>
                                </div>
                            </div>
                            
                            <h4 style={{ marginTop: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>Order Items</h4>
                            <table className="admin-table" style={{ marginTop: '0.5rem' }}>
                                <thead>
                                    <tr>
                                        <th>Product ID</th>
                                        <th>Product Name</th>
                                        <th>Quantity</th>
                                        <th>Unit Price</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedOrder.items && selectedOrder.items.map(item => (
                                        <tr key={item.productId}>
                                            <td>{item.productId}</td>
                                            <td>{item.productName}</td>
                                            <td>{item.quantity}</td>
                                            <td>{formatCurrency(item.unitPrice)}</td>
                                            <td>{formatCurrency(item.unitPrice * item.quantity)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
