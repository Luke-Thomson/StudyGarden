import React from "react";
import {Link} from "react-router-dom";
import logo from "../../assets/ui/logo.png";
import "./Navbar.css";

interface NavbarProps {
    coins: number;
    userName?: string;
    onLogout?: () => void | Promise<void>;
}

const Navbar: React.FC<NavbarProps> = ({coins, userName, onLogout}) => {
    return (
        <header className="main-header">
            <div className="left-section">
                <div className="logo-wrapper" aria-hidden={false}>
                    <img src={logo} alt="Study Garden logo" className="navbar-logo-img"/>
                    <Link
                        to="/study"
                        className="logo-overlay left"
                        aria-label="Go to Study section"
                        title="Study"
                    />
                    <div className="logo-center" aria-hidden="true"/>
                </div>
                <nav className="nav-options" aria-label="Main navigation">
                    <Link to="/study" className="nav-link">Study</Link>
                    <Link to="/garden" className="nav-link">Garden</Link>
                </nav>
            </div>
            <div className="right-section">
                <div className="piggy-bank" title="Coins Icon">
                    <img src="/piggybank.png" className="piggy-icon" alt=""/>
                    <span className="coin-count">{coins}</span>
                </div>
                <button className="profile-btn" onClick={onLogout}>
                    {userName ? `Sign out (${userName})` : "Sign Out"}
                </button>
            </div>
        </header>
    );
};
export default Navbar;