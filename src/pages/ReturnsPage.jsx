import './ReturnsPage.css';

export default function ReturnsPage() {
    return (
        <div className="returns-page">
            <div className="returns-page__header">
                <h1 className="returns-page__title">Returns & Refund Policy</h1>
                <p className="returns-page__subtitle">
                    We want you to be completely satisfied with your purchase. Please review our return policy below.
                </p>
            </div>

            <div className="returns-page__content">
                <section className="returns-section">
                    <h2>Return Eligibility</h2>
                    <ul>
                        <li>Items can be returned within <strong>30 days</strong> of delivery.</li>
                        <li>Products must be in their original condition, unused, and in original packaging.</li>
                        <li>Items marked as "Final Sale" or "Non-Returnable" cannot be returned.</li>
                        <li>Personalized or custom-made items are not eligible for return.</li>
                    </ul>
                </section>

                <section className="returns-section">
                    <h2>How to Request a Return</h2>
                    <ol>
                        <li>Log in to your Vendora account and navigate to <strong>My Orders</strong>.</li>
                        <li>Find the order containing the item you wish to return.</li>
                        <li>Contact our support team at <strong>support@vendora.com</strong> with your order number and reason for return.</li>
                        <li>Our team will review your request and provide a return authorization within 2 business days.</li>
                        <li>Ship the item back using the provided return label.</li>
                    </ol>
                </section>

                <section className="returns-section">
                    <h2>Refund Process</h2>
                    <ul>
                        <li>Refunds are processed within <strong>5–10 business days</strong> after we receive and inspect the returned item.</li>
                        <li>The refund will be credited to your original payment method.</li>
                        <li>Shipping costs are non-refundable unless the return is due to our error (defective, damaged, or wrong item).</li>
                    </ul>
                </section>

                <section className="returns-section">
                    <h2>Damaged or Defective Items</h2>
                    <p>
                        If you received a damaged or defective item, please contact us within <strong>48 hours</strong> of delivery.
                        Include photos of the damage and your order number. We'll arrange a free return and send a replacement or
                        issue a full refund, including shipping costs.
                    </p>
                </section>

                <section className="returns-section">
                    <h2>Contact Us</h2>
                    <p>
                        For any questions about our return policy, please reach out to our customer service team:
                    </p>
                    <ul>
                        <li><strong>Email:</strong> support@vendora.com</li>
                        <li><strong>Phone:</strong> +40630080790</li>
                        <li><strong>Address:</strong> Bulevardul Decebal 107, Craiova 200776</li>
                    </ul>
                </section>
            </div>
        </div>
    );
}
