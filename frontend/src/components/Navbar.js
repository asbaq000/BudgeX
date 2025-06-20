import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

const Navbar = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <NavLink to="/dashboard">BudgeX</NavLink>
      </div>
      <button className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
        &#9776;
      </button>
      <nav className={`navbar-links ${isMenuOpen ? "active" : ""}`}>
        <ul>
          <li>
            <NavLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/transactions" onClick={() => setIsMenuOpen(false)}>
              Transactions
            </NavLink>
          </li>
          <li>
            <NavLink to="/profile" onClick={() => setIsMenuOpen(false)}>
              Profile
            </NavLink>
          </li>
          <li>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </li>
        </ul>
      </nav>
      <div className="navbar-user">
        <span>{auth.user?.firstName} {auth.user?.lastName}</span>
      </div>
    </header>
  );
};

export default Navbar;
