import React from 'react';
import { Link, useHistory } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function NavBar() {
  const { isAuthed, logout } = useAuth();
  const history = useHistory();

  function handleLogout() {
    logout();
    history.push('/login');
  }

  return (
    <nav style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
      <Link to="/">Home</Link>
      {!isAuthed && <Link to="/login">Login</Link>}
      {!isAuthed && <Link to="/signup">Signup</Link>}
      {isAuthed && <Link to="/dashboard">Dashboard</Link>}
      {isAuthed && <Link to="/readings">Readings</Link>}
      {isAuthed && <Link to="/medications">Medications</Link>}
      {isAuthed && <Link to="/profile">Profile</Link>}
      {isAuthed && (
        <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>
          Logout
        </button>
      )}
    </nav>
  );
}
