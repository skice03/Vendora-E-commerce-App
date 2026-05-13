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
    const [newAddress, setNewAddress] = useState({
        street: '', city: '', zipCode: '', country: '', isDefault: false
    });
    const [isSavingAddress, setIsSavingAddress] = useState(false);

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

    async function handleAddAddress(e) {
        e.preventDefault();
        setIsSavingAddress(true);
        try {
            await apiPost('/profile/addresses', newAddress);
            showSuccess('Address added successfully!');
            setShowAddressForm(false);
            setNewAddress({ street: '', city: '', zipCode: '', country: '', isDefault: false });
            fetchAddresses();
        } catch (err) {
            showError(err.message || 'Failed to add address.');
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
                            <Button variant="outline" size="sm" onClick={() => setShowAddressForm(true)}>
                                + Add New
                            </Button>
                        )}
                    </div>

                    {showAddressForm && (
                        <form className="address-form" onSubmit={handleAddAddress}>
                            <div className="address-form__grid">
                                <div className="profile-form__group">
                                    <label>Street Address</label>
                                    <input type="text" required value={newAddress.street} onChange={e => setNewAddress({...newAddress, street: e.target.value})} />
                                </div>
                                <div className="profile-form__group">
                                    <label>City</label>
                                    <input type="text" required value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                                </div>
                                <div className="profile-form__group">
                                    <label>Zip Code</label>
                                    <input type="text" required value={newAddress.zipCode} onChange={e => setNewAddress({...newAddress, zipCode: e.target.value})} />
                                </div>
                                <div className="profile-form__group">
                                    <label>Country</label>
                                    <input type="text" required value={newAddress.country} onChange={e => setNewAddress({...newAddress, country: e.target.value})} />
                                </div>
                            </div>
                            <label className="address-form__checkbox">
                                <input type="checkbox" checked={newAddress.isDefault} onChange={e => setNewAddress({...newAddress, isDefault: e.target.checked})} />
                                Set as default shipping address
                            </label>
                            <div className="address-form__actions">
                                <Button type="submit" variant="primary" isLoading={isSavingAddress}>Save Address</Button>
                                <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>Cancel</Button>
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
                                    <button className="address-card__delete" onClick={() => handleDeleteAddress(addr.id)}>
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
