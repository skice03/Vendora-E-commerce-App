import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Register.css';

export default function Register() {
    // we use setter functiones for state as per REQ 
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        setError('');
        setSuccess('');

        try {
            // we send the data to the C# controller
            const response = await fetch('http://localhost:5169/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    passwordHash: password // backend awaits "passwordHash"
                }),
            });

            if (response.ok) {
                setSuccess('Registration successful! You can now log in.');
                // clear fields 
                setFirstName('');
                setLastName('');
                setEmail('');
                setPassword('');
            } else {
                const data = await response.json();
                setError(data.message || 'Registration failed. Email might already exist.');
            }
        } catch (err) {
            setError('Could not connect to the server. Is the C# API running?');
        }
    };

    return (
        <div className="register-container">
            <h2>Create an account</h2>
            {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
            {success && <p className="success-message" style={{ color: 'green' }}>{success}</p>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>First Name</label>
                    <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Last Name</label>
                    <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Email Address</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit">Register</button>
            </form>
            <p style={{ marginTop: '15px', textAlign: 'center' }}>
                Already have an account? <Link to="/login">Log in here</Link>
            </p>
        </div>
    );
}