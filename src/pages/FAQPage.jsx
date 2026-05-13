import { useState } from 'react';
import './FAQPage.css';

const FAQ_DATA = [
    {
        category: 'Orders & Shipping',
        items: [
            {
                question: 'How do I place an order?',
                answer: 'Browse our product catalog, add items to your cart, and proceed to checkout. You\'ll need to create an account or log in, enter your shipping address, and confirm your order. You\'ll receive an order confirmation once the order is placed.'
            },
            {
                question: 'How can I track my order?',
                answer: 'After logging in, navigate to "My Orders" from the navigation bar. You\'ll see all your orders with their current status (Pending, Processing, Shipped, Delivered, or Cancelled).'
            },
            {
                question: 'What are the shipping costs?',
                answer: 'Standard shipping is $9.99 for orders under $50. Orders over $50 qualify for free shipping. Shipping times vary depending on your location.'
            },
            {
                question: 'Can I cancel my order?',
                answer: 'Orders can be cancelled by our customer service team before they are shipped. Please contact us as soon as possible if you need to cancel. Once an order has been shipped, it cannot be cancelled.'
            },
        ]
    },
    {
        category: 'Account & Profile',
        items: [
            {
                question: 'How do I create an account?',
                answer: 'Click "Register" in the top navigation bar and fill in your first name, last name, email address, and a secure password. After registration, you\'ll be automatically logged in.'
            },
            {
                question: 'How do I update my profile information?',
                answer: 'Navigate to your Profile page by clicking the profile icon in the navigation bar. You can update your first name, last name, and manage your saved shipping addresses.'
            },
            {
                question: 'I forgot my password. What should I do?',
                answer: 'Password reset functionality is coming soon. In the meantime, please contact our support team at support@vendora.com for assistance.'
            },
        ]
    },
    {
        category: 'Products & Reviews',
        items: [
            {
                question: 'How do I leave a product review?',
                answer: 'You can only review products that you have purchased and received (order status must be "Delivered"). Go to the product page and scroll down to the review section to submit your 1-5 star rating and optional comment.'
            },
            {
                question: 'Can I add products to a wishlist?',
                answer: 'Yes! When browsing products, click the heart icon to add an item to your wishlist. You can view your wishlist and move items to your cart at any time from the wishlist page.'
            },
            {
                question: 'What if a product is out of stock?',
                answer: 'Out-of-stock products are clearly marked on the product page and cannot be added to the cart. Check back regularly as our inventory is updated frequently.'
            },
        ]
    },
    {
        category: 'Payment & Security',
        items: [
            {
                question: 'What payment methods are accepted?',
                answer: 'We are currently integrating secure payment processing via Stripe. Full credit card and digital wallet support will be available soon. All transactions will be encrypted and secure.'
            },
            {
                question: 'Is my personal information secure?',
                answer: 'Yes. We use industry-standard security practices including BCrypt password hashing, JWT authentication, and secure HTTPS connections. We never store your password in plain text.'
            },
        ]
    },
];

export default function FAQPage() {
    const [openIndex, setOpenIndex] = useState(null);

    function toggleItem(globalIndex) {
        setOpenIndex(openIndex === globalIndex ? null : globalIndex);
    }

    let globalIndex = 0;

    return (
        <div className="faq-page">
            <div className="faq-page__header">
                <h1 className="faq-page__title">Frequently Asked Questions</h1>
                <p className="faq-page__subtitle">
                    Find answers to common questions about Vendora. Can't find what you're looking for? Contact us at <strong>support@vendora.com</strong>.
                </p>
            </div>

            <div className="faq-page__content">
                {FAQ_DATA.map((section) => (
                    <div key={section.category} className="faq-section">
                        <h2 className="faq-section__title">{section.category}</h2>
                        <div className="faq-section__items">
                            {section.items.map((item) => {
                                const currentIndex = globalIndex++;
                                const isOpen = openIndex === currentIndex;
                                return (
                                    <div key={currentIndex} className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
                                        <button
                                            className="faq-item__question"
                                            onClick={() => toggleItem(currentIndex)}
                                            aria-expanded={isOpen}
                                        >
                                            <span>{item.question}</span>
                                            <span className="faq-item__icon">{isOpen ? '−' : '+'}</span>
                                        </button>
                                        {isOpen && (
                                            <div className="faq-item__answer">
                                                <p>{item.answer}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
