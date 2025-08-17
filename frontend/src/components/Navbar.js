import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <nav className="navbar navbar-light bg-light mb-3">
      <div className="container">
        <Link to="/" className="navbar-brand">Kanban-Lite</Link>
        <div>
          {user ? (
            <>
              <span className="me-3">Hi, {user.username}</span>
              <button className="btn btn-outline-secondary btn-sm" onClick={logout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-primary me-2">Login</Link>
              <Link to="/register" className="btn btn-outline-primary">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
