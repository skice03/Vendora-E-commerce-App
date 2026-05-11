import { useState } from 'react';
import './LoginPage.css';

export default function LoginPage({ setActivePage }) {
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

                // save user data in browser storage
                localStorage.setItem('user', JSON.stringify(userData));
                console.log('Login successful:', userData);

                setActivePage('home');

                // refresh for navbar
                window.location.reload();
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
                    <button
                        className="login-link-btn" // Folosim o clasă nouă pentru stilizare
                        onClick={() => setActivePage('register')}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#007BFF',
                            cursor: 'pointer',
                            padding: 0,
                            font: 'inherit',
                            textDecoration: 'underline'
                        }}
                    >
                        Register here
                    </button>
                </p>
            </div>
        </div>
    );
}