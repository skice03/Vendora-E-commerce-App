import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiGet, apiPut, apiPost, apiDelete } from '../utils/api.js';
import Button from '../components/ui/Button.jsx';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user, login } = useAuth(); // login from auth context can re-hydrate user details
    const { showSuccess, showError } = useToast();

    const [profile, setProfile] = useState({ firstName: '', lastName: '' });
    const [addresses, setAddresses] = useState([]);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    
    // Address Form State
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddressId, setEditingAddressId] = useState(null);
    const [addressForm, setAddressForm] = useState({
        street: '', city: '', zipCode: '', country: '', isDefault: false
    });
    const [isSavingAddress, setIsSavingAddress] = useState(false);

    // Change Password State
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '', newPassword: '', confirmPassword: ''
    });
    const [isSavingPassword, setIsSavingPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({
                firstName: user.firstName || '',
                lastName: user.lastName || ''
            });
            fetchAddresses();
        }
    }, [user]);

    async function fetchAddresses() {
        try {
            const data = await apiGet('/profile/addresses');
            setAddresses(data);
        } catch (err) {
            showError('Failed to load addresses.');
        }
    }

    async function handleUpdateProfile(e) {
        e.preventDefault();
        setIsSavingProfile(true);
        try {
            const data = await apiPut('/profile', profile);
            showSuccess(data.Message || 'Profile updated!');
            
            // Re-hydrate auth context user info using local storage or login trick
            const storedUser = JSON.parse(localStorage.getItem('vendora_user'));
            if (storedUser) {
                storedUser.firstName = data.firstName;
                storedUser.lastName = data.lastName;
                localStorage.setItem('vendora_user', JSON.stringify(storedUser));
                login(storedUser); // Update context state
            }
        } catch (err) {
            showError(err.message || 'Failed to update profile.');
        } finally {
            setIsSavingProfile(false);
        }
    }

    function openAddAddress() {
        setEditingAddressId(null);
        setAddressForm({ street: '', city: '', zipCode: '', country: '', isDefault: false });
        setShowAddressForm(true);
    }

    function openEditAddress(addr) {
        setEditingAddressId(addr.id);
        setAddressForm({
            street: addr.street,
            city: addr.city,
            zipCode: addr.zipCode,
            country: addr.country,
            isDefault: addr.isDefault
        });
        setShowAddressForm(true);
    }

    async function handleSaveAddress(e) {
        e.preventDefault();
        setIsSavingAddress(true);
        try {
            if (editingAddressId) {
                // Edit existing address (REQ-42)
                await apiPut(`/profile/addresses/${editingAddressId}`, addressForm);
                showSuccess('Address updated successfully!');
            } else {
                // Add new address
                await apiPost('/profile/addresses', addressForm);
                showSuccess('Address added successfully!');
            }
            setShowAddressForm(false);
            setEditingAddressId(null);
            setAddressForm({ street: '', city: '', zipCode: '', country: '', isDefault: false });
            fetchAddresses();
        } catch (err) {
            showError(err.message || 'Failed to save address.');
        } finally {
            setIsSavingAddress(false);
        }
    }

    async function handleDeleteAddress(id) {
        if (!window.confirm('Delete this address?')) return;
        try {
            await apiDelete(`/profile/addresses/${id}`);
            showSuccess('Address deleted.');
            fetchAddresses();
        } catch (err) {
            showError(err.message || 'Failed to delete address.');
        }
    }

    async function handleChangePassword(e) {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            showError('New passwords do not match.');
            return;
        }
        if (passwordForm.newPassword.length < 8) {
            showError('New password must be at least 8 characters.');
            return;
        }
        setIsSavingPassword(true);
        try {
            const data = await apiPut('/profile/change-password', {
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            showSuccess(data.Message || 'Password changed successfully!');
            setShowPasswordForm(false);
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showError(err.message || 'Failed to change password.');
        } finally {
            setIsSavingPassword(false);
        }
    }

    if (!user) return <div className="container">Loading profile...</div>;

    return (
        <div className="profile-page">
            <h1 className="profile-page__heading">My Profile</h1>
            
            <div className="profile-layout">
                {/* Personal Info */}
                <section className="profile-section">
                    <h2 className="profile-section__title">Personal Information</h2>
                    <form className="profile-form" onSubmit={handleUpdateProfile}>
                        <div className="profile-form__group">
                            <label>Email Address</label>
                            <input type="email" value={user.email} disabled />
                            <small>Email cannot be changed.</small>
                        </div>
                        <div className="profile-form__group">
                            <label>First Name</label>
                            <input 
                                type="text" 
                                value={profile.firstName} 
                                onChange={e => setProfile({...profile, firstName: e.target.value})} 
                                required 
                            />
                        </div>
                        <div className="profile-form__group">
                            <label>Last Name</label>
                            <input 
                                type="text" 
                                value={profile.lastName} 
                                onChange={e => setProfile({...profile, lastName: e.target.value})} 
                                required 
                            />
                        </div>
                        <Button type="submit" variant="primary" isLoading={isSavingProfile}>
                            Save Changes
                        </Button>
                    </form>
                </section>

                {/* Saved Addresses */}
                <section className="profile-section">
                    <div className="profile-section__header">
                        <h2 className="profile-section__title">Saved Addresses</h2>
                        {!showAddressForm && (
                            <Button variant="outline" size="sm" onClick={openAddAddress}>
                                + Add New
                            </Button>
                        )}
                    </div>

                    {showAddressForm && (
                        <form className="address-form" onSubmit={handleSaveAddress}>
                            <h3 className="address-form__title">
                                {editingAddressId ? '✏️ Edit Address' : '📦 New Address'}
                            </h3>
                            <div className="address-form__grid">
                                <div className="profile-form__group">
                                    <label>Street Address</label>
                                    <input type="text" required value={addressForm.street} onChange={e => setAddressForm({...addressForm, street: e.target.value})} />
                                </div>
                                <div className="profile-form__group">
                                    <label>City</label>
                                    <input type="text" required value={addressForm.city} onChange={e => setAddressForm({...addressForm, city: e.target.value})} />
                                </div>
                                <div className="profile-form__group">
                                    <label>Zip Code</label>
                                    <input type="text" required value={addressForm.zipCode} onChange={e => setAddressForm({...addressForm, zipCode: e.target.value})} />
                                </div>
                                <div className="profile-form__group">
                                    <label>Country</label>
                                    <input type="text" required value={addressForm.country} onChange={e => setAddressForm({...addressForm, country: e.target.value})} />
                                </div>
                            </div>
                            <label className="address-form__checkbox">
                                <input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({...addressForm, isDefault: e.target.checked})} />
                                Set as default shipping address
                            </label>
                            <div className="address-form__actions">
                                <Button type="submit" variant="primary" isLoading={isSavingAddress}>
                                    {editingAddressId ? 'Update Address' : 'Save Address'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => { setShowAddressForm(false); setEditingAddressId(null); }}>Cancel</Button>
                            </div>
                        </form>
                    )}

                    <div className="address-list">
                        {addresses.length === 0 && !showAddressForm ? (
                            <p className="address-list__empty">No addresses saved yet.</p>
                        ) : (
                            addresses.map(addr => (
                                <div key={addr.id} className="address-card">
                                    {addr.isDefault && <span className="address-card__badge">Default</span>}
                                    <p><strong>{addr.street}</strong></p>
                                    <p>{addr.city}, {addr.zipCode}</p>
                                    <p>{addr.country}</p>
                                    <div className="address-card__actions">
                                        <button className="address-card__edit" onClick={() => openEditAddress(addr)}>
                                            Edit
                                        </button>
                                        <button className="address-card__delete" onClick={() => handleDeleteAddress(addr.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Change Password */}
                <section className="profile-section">
                    <div className="profile-section__header">
                        <h2 className="profile-section__title">Security</h2>
                        {!showPasswordForm && (
                            <Button variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                                Change Password
                            </Button>
                        )}
                    </div>
                    
                    {showPasswordForm && (
                        <form className="profile-form" onSubmit={handleChangePassword}>
                            <div className="profile-form__group">
                                <label>Current Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={passwordForm.currentPassword} 
                                    onChange={e => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                                    placeholder="Enter current password"
                                />
                            </div>
                            <div className="profile-form__group">
                                <label>New Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    minLength={8}
                                    value={passwordForm.newPassword} 
                                    onChange={e => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                    placeholder="Min. 8 characters"
                                />
                            </div>
                            <div className="profile-form__group">
                                <label>Confirm New Password</label>
                                <input 
                                    type="password" 
                                    required 
                                    value={passwordForm.confirmPassword} 
                                    onChange={e => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                    placeholder="Re-enter new password"
                                />
                            </div>
                            <div className="address-form__actions">
                                <Button type="submit" variant="primary" isLoading={isSavingPassword}>
                                    Update Password
                                </Button>
                                <Button type="button" variant="outline" onClick={() => { setShowPasswordForm(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    )}
                    
                    {!showPasswordForm && (
                        <p className="profile-section__hint">
                            Keep your account secure by using a strong, unique password.
                        </p>
                    )}
                </section>
            </div>
        </div>
    );
}
