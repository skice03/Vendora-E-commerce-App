import { useState } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage.jsx';

export default function App() {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="app-container">

      {/* navbar */}
      <nav className="navbar">
        <div className="brand-logo" onClick={() => setActivePage('home')}>
          Vendora
        </div>

        <div className="nav-links">
          <button className="btn-nav" onClick={() => setActivePage('login')}>
            Log In
          </button>
          <button className="btn-nav btn-primary" onClick={() => setActivePage('register')}>
            Register
          </button>
        </div>
      </nav>

      {/* main */}
      <main className="main-content">

        {activePage === 'home' && (
          <div>
            <h1 className="text-dark">Welcome to Vendora</h1>
            <p className="text-muted">Your favourite E-Commerce platform.</p>
          </div>
        )}

        {activePage === 'login' && <LoginPage setActivePage={setActivePage} />}

        {activePage === 'register' && (
          <div>
            <h2 className="text-dark">Coming soon</h2>
          </div>
        )}

      </main>
    </div>
  );
}