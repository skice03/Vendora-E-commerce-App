import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext.jsx';
import { apiPost } from '../utils/api.js';
import { isValidPassword, isValidEmail } from '../utils/validators.js';

// UI Components
import Card, { CardBody } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

export default function Register() {
    const navigate = useNavigate();
    const { showError, showSuccess } = useToast();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // Field-specific validation errors for real-time feedback
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        
        if (!firstName.trim()) newErrors.firstName = 'First name is required';
        if (!lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!isValidEmail(email)) newErrors.email = 'Please enter a valid email address';
        if (!isValidPassword(password)) newErrors.password = 'Password must be at least 8 characters long';
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);

        try {
            // Using the new centralized API wrapper
            await apiPost('/auth/register', {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                email: email.trim(),
                passwordHash: password
            });

            showSuccess('Registration successful! You can now log in.');
            navigate('/login');
            
        } catch (err) {
            showError(err.message || 'Registration failed. Email might already exist.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', padding: 'var(--space-8) 0' }}>
            <Card variant="glass" style={{ width: '100%', maxWidth: '480px', padding: 'var(--space-6)' }}>
                <CardBody>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-extrabold)' }}>Create an Account</h2>
                        <p style={{ color: 'var(--color-gray-500)', marginTop: 'var(--space-2)' }}>Join Vendora and start shopping</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                            <Input
                                label="First Name"
                                name="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="John"
                                error={errors.firstName}
                                required
                            />
                            <Input
                                label="Last Name"
                                name="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Doe"
                                error={errors.lastName}
                                required
                            />
                        </div>

                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            error={errors.email}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            error={errors.password}
                            helperText="Must be at least 8 characters long"
                            required
                        />

                        <Button 
                            type="submit" 
                            variant="primary" 
                            fullWidth 
                            isLoading={isLoading}
                            style={{ marginTop: 'var(--space-2)' }}
                        >
                            Register
                        </Button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                        Already have an account?{' '}
                        <Link to="/login" style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                            Log in here
                        </Link>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}