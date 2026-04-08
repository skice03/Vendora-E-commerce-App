import { useState } from 'react';
import './LoginPage.css';

export default function LoginPage({ setActivePage }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();

        if (email === '' || password === '') {
            setErrorMessage('Please fill in both fields.');
            return;
        }

        console.log('Login data ready for backend:', { email, password });
        setErrorMessage('');
    };

    return (
        <div className="login-wrapper">
            <div className="login-card">
                <h2 className="login-title">Log In to Vendora</h2>

                {errorMessage && (
                    <div className="error-message">
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
                        />
                    </div>

                    <button type="submit" className="btn-submit">
                        Sign In
                    </button>
                </form>

                <p className="login-footer">
                    Don't have an account?{' '}
                    <a
                        href="#"
                        className="login-link"
                        onClick={(e) => {
                            e.preventDefault();
                            setActivePage('register');
                        }}
                    >
                        Register here
                    </a>
                </p>
            </div>
        </div>
    );
}