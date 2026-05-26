import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, apiPut, apiDelete, apiUpload } from '../../utils/api.js';
import Button from '../../components/ui/Button.jsx';
import Input from '../../components/ui/Input.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { formatCurrency, resolveImageUrl } from '../../utils/formatters.js';
import './AdminProductsPage.css';

export default function AdminProductsPage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
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

    // REQ-54: Image upload state
    const [imageFiles, setImageFiles] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const data = await apiGet('/products');
            setProducts(data);
            setError(null);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const data = await apiGet('/categories');
            setCategories(data);
        } catch {
            // Silently fail — form will still work with manual ID entry
        }
    };

    const handleOpenModal = (product = null) => {
        setFormError(null);
        setImageFiles([]);
        setImagePreviews([]);

        if (product) {
            setEditingProduct(product);
            setFormData({ ...product });
            setExistingImages(product.images || []);
        } else {
            setEditingProduct(null);
            setFormData({
                sku: '',
                name: '',
                description: '',
                price: 0,
                stockQuantity: 0,
                categoryId: categories.length > 0 ? categories[0].id : 1,
                imageUrl: '',
                isDeleted: false
            });
            setExistingImages([]);
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProduct(null);
        setImageFiles([]);
        setImagePreviews([]);
        setExistingImages([]);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
        }));
    };

    const handleCategoryChange = (e) => {
        setFormData(prev => ({
            ...prev,
            categoryId: parseInt(e.target.value)
        }));
    };

    // REQ-54: Handle file selection for image upload
    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        setImageFiles(prev => [...prev, ...files]);

        // Generate previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImagePreviews(prev => [...prev, { file, preview: ev.target.result }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeNewImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = async (imageId) => {
        try {
            await apiDelete(`/products/images/${imageId}`);
            setExistingImages(prev => prev.filter(img => img.id !== imageId));
        } catch (err) {
            setFormError('Failed to remove image: ' + err.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError(null);
        setIsUploading(true);

        try {
            let productId;

            if (editingProduct) {
                // Update (REQ-35)
                await apiPut(`/products/${editingProduct.id}`, { ...formData, id: editingProduct.id });
                productId = editingProduct.id;
            } else {
                // Create (REQ-35)
                const created = await apiPost('/products', formData);
                productId = created.id;
            }

            // Upload new images (REQ-54)
            for (let i = 0; i < imageFiles.length; i++) {
                const file = imageFiles[i];
                const fd = new FormData();
                fd.append('file', file);

                const uploadResult = await apiUpload('/products/upload-image', fd);

                // Add image record to product
                await apiPost(`/products/${productId}/images`, {
                    imageUrl: uploadResult.imageUrl,
                    displayOrder: (existingImages.length) + i,
                    isPrimary: existingImages.length === 0 && i === 0 // First image is primary if no existing
                });
            }

            await fetchProducts();
            handleCloseModal();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product? It will be removed from the catalog.')) return;
        
        try {
            // Soft delete (REQ-37)
            await apiDelete(`/products/${id}`);
            // Immediately remove from the displayed list
            setProducts(prev => prev.filter(p => p.id !== id));
        } catch (err) {
            alert('Failed to delete: ' + err.message);
        }
    };

    // Build a nested category display for the dropdown
    function buildCategoryOptions() {
        const parentCategories = categories.filter(c => !c.parentCategoryId);
        const result = [];

        parentCategories.forEach(parent => {
            result.push({ id: parent.id, label: parent.name, isParent: true });
            const children = categories.filter(c => c.parentCategoryId === parent.id);
            children.forEach(child => {
                result.push({ id: child.id, label: `  └ ${child.name}`, isParent: false });
            });
        });

        return result;
    }

    // Get the display image URL for a product
    function getProductImageUrl(product) {
        const primaryImg = product.images?.find(img => img.isPrimary);
        const firstImg = product.images?.[0];
        const url = primaryImg?.imageUrl || firstImg?.imageUrl || product.imageUrl;
        return resolveImageUrl(url);
    }

    if (isLoading && products.length === 0) {
        return <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>Loading products...</div>;
    }

    const categoryOptions = buildCategoryOptions();

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
                            <th>Image</th>
                            <th>SKU</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} style={{ opacity: product.isDeleted ? 0.6 : 1 }}>
                                <td>
                                    {getProductImageUrl(product) ? (
                                        <img
                                            src={getProductImageUrl(product)}
                                            alt={product.name}
                                            style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }}
                                        />
                                    ) : (
                                        <span style={{ color: 'var(--color-gray-400)', fontSize: '0.8rem' }}>No image</span>
                                    )}
                                </td>
                                <td>{product.sku}</td>
                                <td>
                                    <Link to={`/products/${product.id}`} style={{ color: 'var(--primary-color)', fontWeight: 500, textDecoration: 'none' }}>
                                        {product.name}
                                    </Link>
                                </td>
                                <td>
                                    <span className="category-badge">{product.categoryName || 'Uncategorized'}</span>
                                </td>
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
                                <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
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

                        {/* Category Dropdown */}
                        <div className="form-group">
                            <label className="form-label">Category *</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleCategoryChange}
                                className="form-select"
                                required
                            >
                                {categoryOptions.length > 0 ? (
                                    categoryOptions.map(opt => (
                                        <option
                                            key={opt.id}
                                            value={opt.id}
                                            style={{ fontWeight: opt.isParent ? 'bold' : 'normal' }}
                                        >
                                            {opt.label}
                                        </option>
                                    ))
                                ) : (
                                    <option value={formData.categoryId}>Category ID: {formData.categoryId}</option>
                                )}
                            </select>
                        </div>
                    </div>

                    {/* REQ-54: Image Upload Section */}
                    <div className="image-upload-section">
                        <label className="form-label">📷 Product Images</label>
                        
                        {/* Existing images (when editing) */}
                        {existingImages.length > 0 && (
                            <div className="image-preview-grid">
                                {existingImages.map(img => (
                                    <div key={img.id} className="image-preview-item">
                                        <img
                                            src={resolveImageUrl(img.imageUrl)}
                                            alt="Product"
                                        />
                                        {img.isPrimary && <span className="image-primary-badge">Primary</span>}
                                        <button
                                            type="button"
                                            className="image-remove-btn"
                                            onClick={() => removeExistingImage(img.id)}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* New image previews */}
                        {imagePreviews.length > 0 && (
                            <div className="image-preview-grid">
                                {imagePreviews.map((item, index) => (
                                    <div key={index} className="image-preview-item image-preview-item--new">
                                        <img src={item.preview} alt={`New upload ${index + 1}`} />
                                        <span className="image-new-badge">New</span>
                                        <button
                                            type="button"
                                            className="image-remove-btn"
                                            onClick={() => removeNewImage(index)}
                                        >✕</button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            onChange={handleImageSelect}
                            className="image-file-input"
                        />
                        <small style={{ color: 'var(--color-gray-500)' }}>
                            JPEG, PNG, WebP, or GIF. Max 5MB per image. First image will be set as primary.
                        </small>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
                        <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancel</Button>
                        <Button type="submit" variant="primary" isLoading={isUploading}>
                            {editingProduct ? 'Save Changes' : 'Create Product'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
