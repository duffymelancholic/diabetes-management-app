import React from 'react';
import { NavLink, useHistory } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function NavBar() {
  const { isAuthed, logout } = useAuth();
  const history = useHistory();

  function handleLogout() {
    logout();
    history.push('/login');
  }

  return (
    <header className="nav">
      <div className="nav-inner">
        <NavLink to={isAuthed ? '/dashboard' : '/'} className="brand">DiaManage</NavLink>
        <nav className="nav-links">
          {!isAuthed && <NavLink exact to="/login" activeClassName="active">Login</NavLink>}
          {!isAuthed && <NavLink to="/signup" activeClassName="active">Signup</NavLink>}
          {isAuthed && <NavLink to="/dashboard" activeClassName="active">Dashboard</NavLink>}
          {isAuthed && <NavLink to="/readings" activeClassName="active">Readings</NavLink>}
          {isAuthed && <NavLink to="/medications" activeClassName="active">Medications</NavLink>}
          {isAuthed && <NavLink to="/profile" activeClassName="active">Profile</NavLink>}
        </nav>
        {isAuthed && (
          <div className="nav-right">
            <button onClick={handleLogout} className="btn ghost">Logout</button>
          </div>
        )}
      </div>
    </header>
  );
}
