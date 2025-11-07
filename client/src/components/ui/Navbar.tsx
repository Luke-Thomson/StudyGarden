import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/ui/logo.png";
import "./Navbar.css";

const Navbar: React.FC = () => {
  return (
    <header className="main-header">
      <div className="left-section">
        {/* Logo wrapper with two clickable regions and a non-clickable center divider */}
        <div className="logo-wrapper" aria-hidden={false}>
          <img src={logo} alt="Study Garden logo" className="navbar-logo-img" />

          {/* Left clickable area -> Study */}
          <Link
            to="/study"
            className="logo-overlay left"
            aria-label="Go to Study section"
            title="Study"
          />

          {/* Center area (pig) - intentionally non-clickable */}
          <div className="logo-center" aria-hidden="true" />

          {/* Right clickable area -> Garden */}
          <Link
            to="/garden"
            className="logo-overlay right"
            aria-label="Go to Garden section"
            title="Garden"
          />
        </div>

        {/* Remove duplicate Study/Garden text links — only keep other nav links if needed */}
        <nav className="nav-options" aria-label="Main navigation">
          {/* If you don't want any text nav items, remove the contents of this <nav> */}
          <Link to="/profile" className="nav-link">Profile</Link>
        </nav>
      </div>

      <div className="right-section">
        <div className="piggy-bank" title="Coins">
          <img src="/icons/piggy.svg" className="piggy-icon" alt="" />
          <span className="coin-count">0</span>
        </div>
        <button className="profile-btn">Sign In</button>
      </div>
    </header>
  );
};

export default Navbar;