import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import './LoginPage.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();

        if (email === '' || password === '') {
            setErrorMessage('Please fill in both fields.');
            return;
        }

        setErrorMessage('');

        try {
            // send req to backend
            const response = await fetch('http://localhost:5169/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                }),
            });

            if (response.ok) {
                const userData = await response.json();

                // save user data via the new AuthContext
                login(userData);
                console.log('Login successful:', userData);

                navigate('/');
            } else {
                const errorText = await response.text();
                setErrorMessage(errorText || 'Invalid email or password.');
            }
        } catch (err) {
            setErrorMessage('Connection to server failed. Make sure the API is running.');
        }
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <h2 className="login-title">Log In to Vendora</h2>

                {errorMessage && (
                    <div className="error-message" style={{ color: 'red', marginBottom: '10px' }}>
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form">
                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="name@example.com"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="********"
                            required
                        />
                    </div>

                    <button type="submit" className="btn-submit">
                        Sign In
                    </button>
                </form>

                <p className="login-footer">
                    Don't have an account?{' '}
                    <Link to="/register" className="login-link">
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}