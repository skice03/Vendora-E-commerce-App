import { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage.jsx';
import Register from './pages/Register.jsx';

export default function App() {
  const [activePage, setActivePage] = useState('home');
  const [user, setUser] = useState(null); // logged in user 

  // check for any user in browser
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // log out
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setActivePage('home');
  };

  return (
    <div className="app-container">
      {/* navbar */}
      <nav className="navbar">
        <div className="brand-logo" onClick={() => setActivePage('home')}>
          Vendora
        </div>

        <div className="nav-links">
          {/* check if user exists */}
          {user ? (
            <>
              <span className="welcome-msg" style={{ marginRight: '15px' }}>Hello, {user.firstName}!</span>
              {user.role === 'Admin' && (
                <button className="btn-nav" onClick={() => setActivePage('admin')}>Dashboard</button>
              )}
              <button className="btn-nav" onClick={handleLogout}>Log Out</button>
            </>
          ) : (
            <>
              <button className="btn-nav" onClick={() => setActivePage('login')}>
                Log In
              </button>
              <button className="btn-nav btn-primary" onClick={() => setActivePage('register')}>
                Register
              </button>
            </>
          )}
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

        {/* ensure Register setActivePage */}
        {activePage === 'register' && <Register setActivePage={setActivePage} />}

        {/* admin page */}
        {activePage === 'admin' && user?.role === 'Admin' && (
          <div>
            <h1 className="text-dark">Admin Dashboard</h1>
            <p>Management options coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
}