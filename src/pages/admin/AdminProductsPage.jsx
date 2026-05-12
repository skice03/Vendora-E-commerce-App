import { useState, useEffect } from 'react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../utils/api.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { formatCurrency } from '../../utils/formatters.js';
import './AdminProductsPage.css';

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        description: '',
        price: 0,
        stockQuantity: 0,
        categoryId: 1,
        imageUrl: '',
        isDeleted: false
    });
    const [formError, setFormError] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const data = await apiGet('/products?includeDeleted=true');
            setProducts(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (product = null) => {
        setFormError(null);
        if (product) {
            setEditingProduct(product);
            setFormData({ ...product });
        } else {
            setEditingProduct(null);
            setFormData({
                sku: '',
                name: '',
                description: '',
                price: 0,
                stockQuantity: 0,
                categoryId: 1,
                imageUrl: '',
                isDeleted: false
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);

        try {
            if (editingProduct) {
                // Update (REQ-35)
                await apiPut(`/products/${editingProduct.id}`, { ...formData, id: editingProduct.id });
            } else {
                // Create (REQ-35)
                await apiPost('/products', formData);
            }
            await fetchProducts();
            handleCloseModal();
        } catch (err) {
            setFormError(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        
        try {
            // Soft delete (REQ-37)
            await apiDelete(`/products/${id}`);
            await fetchProducts();
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };



    if (isLoading && products.length === 0) {
        return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading products...</div>;
    }

    return (
        <div className="admin-dashboard container">
            <div className="admin-header">
                <div>
                    <h1>Product Management</h1>
                    <p className="text-secondary">Manage your catalog, stock, and pricing.</p>
                </div>
                <Button onClick={() => handleOpenModal()} variant="primary">
                    + Add New Product
                </Button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} style={{ opacity: product.isDeleted ? 0.6 : 1 }}>
                                <td>{product.sku}</td>
                                <td>{product.name}</td>
                                <td>{formatCurrency(product.price)}</td>
                                <td>
                                    <span style={{ color: product.stockQuantity === 0 ? 'var(--danger-color)' : 'inherit' }}>
                                        {product.stockQuantity}
                                    </span>
                                </td>
                                <td>
                                    {product.isDeleted ? (
                                        <span className="status-badge status-badge--deleted">Deleted</span>
                                    ) : (
                                        <span className="status-badge status-badge--active">Active</span>
                                    )}
                                </td>
                                <td className="admin-table__actions">
                                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(product)}>
                                        Edit
                                    </Button>
                                    {product.isDeleted ? (
                                        <span className="text-muted" style={{ fontSize: '0.8rem' }}>Cannot be restored</span>
                                    ) : (
                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(product.id)} style={{ color: 'var(--danger-color)' }}>
                                            Delete
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                                    No products found in the database.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
            >
                <form onSubmit={handleSubmit}>
                    {formError && <div className="alert alert-danger" style={{ marginBottom: '1rem' }}>{formError}</div>}
                    
                    <div className="admin-form-grid">
                        <Input
                            label="SKU (REQ-36)"
                            name="sku"
                            value={formData.sku}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            label="Product Name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                        />
                        <div className="admin-form-full">
                            <Input
                                label="Description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <Input
                            label="Price ($)"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            label="Stock Quantity"
                            name="stockQuantity"
                            type="number"
                            min="0"
                            value={formData.stockQuantity}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            label="Category ID"
                            name="categoryId"
                            type="number"
                            min="1"
                            value={formData.categoryId}
                            onChange={handleInputChange}
                            required
                        />
                        <Input
                            label="Image URL"
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit" variant="primary">
                            {editingProduct ? 'Save Changes' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
