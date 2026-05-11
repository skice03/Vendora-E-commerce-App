import { useState, useEffect } from 'react';
import { apiGet, apiDelete, apiPut } from '../../utils/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { formatDate } from '../../utils/formatters.js';
import Spinner from '../../components/ui/Spinner.jsx';
import StarRating from '../../components/ui/StarRating.jsx';
import './AdminReviewsPage.css';

export default function AdminReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { showSuccess, showError } = useToast();

    useEffect(() => {
        fetchReviews();
    }, []);

    const fetchReviews = async () => {
        try {
            setIsLoading(true);
            const data = await apiGet('/reviews/admin');
            setReviews(data);
        } catch (err) {
            showError('Failed to load reviews: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHideReview = async (id) => {
        if (!window.confirm('Are you sure you want to hide this review from the public?')) return;
        
        try {
            await apiDelete(`/reviews/${id}`);
            showSuccess(`Review hidden successfully.`);
            fetchReviews();
        } catch (err) {
            showError('Failed to hide review: ' + err.message);
        }
    };

    const handleRestoreReview = async (id) => {
        try {
            await apiPut(`/reviews/${id}/restore`);
            showSuccess(`Review restored successfully.`);
            fetchReviews();
        } catch (err) {
            showError('Failed to restore review: ' + err.message);
        }
    };

    if (isLoading) {
        return (
            <div className="admin-page container">
                <h2>Moderate Reviews</h2>
                <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner /></div>
            </div>
        );
    }

    return (
        <div className="admin-page container animate-fade-in">
            <header className="admin-header">
                <h2>⭐ Review Moderation</h2>
                <p>Monitor customer feedback and hide inappropriate content.</p>
            </header>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Product</th>
                            <th>Customer</th>
                            <th>Rating</th>
                            <th>Comment</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reviews.length === 0 ? (
                            <tr><td colSpan="7" style={{textAlign: 'center'}}>No reviews found.</td></tr>
                        ) : (
                            reviews.map(review => (
                                <tr key={review.id} style={{ opacity: review.isDeleted ? 0.6 : 1 }}>
                                    <td>{formatDate(review.createdAt)}</td>
                                    <td>{review.productName}</td>
                                    <td>{review.customerName}</td>
                                    <td><StarRating rating={review.rating} size="sm" /></td>
                                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={review.comment}>
                                        {review.comment}
                                    </td>
                                    <td>
                                        {review.isDeleted ? (
                                            <span className="badge badge-cancelled">Hidden</span>
                                        ) : (
                                            <span className="badge badge-delivered">Visible</span>
                                        )}
                                    </td>
                                    <td>
                                        {review.isDeleted ? (
                                            <button 
                                                className="btn-icon" 
                                                onClick={() => handleRestoreReview(review.id)}
                                                title="Restore Review"
                                            >
                                                🔄
                                            </button>
                                        ) : (
                                            <button 
                                                className="btn-icon btn-delete" 
                                                onClick={() => handleHideReview(review.id)}
                                                title="Hide Review"
                                            >
                                                👁️‍🗨️
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
