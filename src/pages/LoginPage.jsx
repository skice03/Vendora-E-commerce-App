import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { apiPost } from '../utils/api.js';

// UI Components
import Card, { CardBody } from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showError, showSuccess } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!email || !password) {
            showError('Please fill in both email and password.');
            return;
        }

        setIsLoading(true);

        try {
            // Using the new centralized api wrapper
            const userData = await apiPost('/auth/login', {
                email,
                password
            });

            // Save user data via the AuthContext
            login(userData);
            showSuccess('Welcome back!');
            navigate('/');
            
        } catch (err) {
            showError(err.message || 'Invalid email or password.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Card variant="glass" style={{ width: '100%', maxWidth: '420px', padding: 'var(--space-6)' }}>
                <CardBody>
                    <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
                        <h2 style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 'var(--font-weight-extrabold)' }}>Welcome Back</h2>
                        <p style={{ color: 'var(--color-gray-500)', marginTop: 'var(--space-2)' }}>Log in to your Vendora account</p>
                    </div>

                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            name="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                        />

                        <div style={{ textAlign: 'right', marginTop: '-var(--space-2)' }}>
                            <a href="#" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-primary)' }}>
                                Forgot Password?
                            </a>
                        </div>

                        <Button 
                            type="submit" 
                            variant="primary" 
                            fullWidth 
                            isLoading={isLoading}
                            style={{ marginTop: 'var(--space-2)' }}
                        >
                            Sign In
                        </Button>
                    </form>

                    <div style={{ textAlign: 'center', marginTop: 'var(--space-6)', fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ fontWeight: 'var(--font-weight-bold)', color: 'var(--color-primary)' }}>
                            Register here
                        </Link>
                    </div>
                </CardBody>
            </Card>
        </div>
    );
}