import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiGet } from '../utils/api.js';
import { formatCurrency, formatDate, resolveImageUrl } from '../utils/formatters.js';
import './MyOrdersPage.css';

const STATUS_COLORS = {
    Pending: 'status--pending',
    Processing: 'status--processing',
    Shipped: 'status--shipped',
    Delivered: 'status--delivered',
    Cancelled: 'status--cancelled',
};

export default function MyOrdersPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        const fetchOrders = async () => {
            try {
                setIsLoading(true);
                const data = await apiGet('/orders/my-orders');
                setOrders(data);
            } catch (err) {
                console.error('Failed to load orders:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [isAuthenticated, navigate]);

    function toggleExpand(orderId) {
        setExpandedOrder(prev => (prev === orderId ? null : orderId));
    }

    if (isLoading) {
        return (
            <div className="my-orders-page">
                <h1 className="my-orders-page__heading">My Orders</h1>
                <div className="my-orders-loading">Loading your orders...</div>
            </div>
        );
    }

    return (
        <div className="my-orders-page">
            <h1 className="my-orders-page__heading">
                📋 My Orders
                {orders.length > 0 && (
                    <span className="my-orders-page__count">({orders.length})</span>
                )}
            </h1>

            {orders.length === 0 ? (
                <div className="my-orders-empty">
                    <span className="my-orders-empty__icon">📦</span>
                    <h2>No orders yet</h2>
                    <p>You haven't placed any orders yet. Start shopping!</p>
                    <Link to="/products" className="my-orders-empty__btn">Browse Products</Link>
                </div>
            ) : (
                <div className="my-orders-list">
                    {orders.map(order => (
                        <div key={order.id} className="order-card">
                            <div
                                className="order-card__header"
                                onClick={() => toggleExpand(order.id)}
                                role="button"
                                tabIndex={0}
                                aria-expanded={expandedOrder === order.id}
                            >
                                <div className="order-card__meta">
                                    <span className="order-card__id">Order #{order.id}</span>
                                    <span className="order-card__date">{formatDate(order.createdAt)}</span>
                                </div>

                                <div className="order-card__info">
                                    <span className={`order-card__status ${STATUS_COLORS[order.status] || ''}`}>
                                        {order.status}
                                    </span>
                                    <span className="order-card__total">{formatCurrency(order.totalAmount)}</span>
                                    <span className="order-card__items-count">
                                        {order.itemsCount} {order.itemsCount === 1 ? 'item' : 'items'}
                                    </span>
                                    <span className={`order-card__expand ${expandedOrder === order.id ? 'expanded' : ''}`}>
                                        ▸
                                    </span>
                                </div>
                            </div>

                            {expandedOrder === order.id && (
                                <div className="order-card__details">
                                    <div className="order-card__shipping">
                                        <strong>Shipping to:</strong> {order.shippingAddress}
                                    </div>

                                    <table className="order-items-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th>Qty</th>
                                                <th>Unit Price</th>
                                                <th>Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <Link to={`/products/${item.productId}`} className="order-items-table__product-link">
                                                            {resolveImageUrl(item.productImage) ? (
                                                                <img
                                                                    src={resolveImageUrl(item.productImage)}
                                                                    alt={item.productName}
                                                                    className="order-items-table__img"
                                                                />
                                                            ) : (
                                                                <span className="order-items-table__no-img">🛍️</span>
                                                            )}
                                                            {item.productName}
                                                        </Link>
                                                    </td>
                                                    <td>{item.quantity}</td>
                                                    <td>{formatCurrency(item.unitPrice)}</td>
                                                    <td>{formatCurrency(item.unitPrice * item.quantity)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
