import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

interface NavbarProps {
  coins: number;
  userName?: string;
  onLogout?: () => void | Promise<void>;
}

/*
  NOTE: This component expects the images to live in the client/public folder.
  If you put them in client/public root use:
    /studyword.png, /pig.png, /gardenword.png

  If instead you placed them in client/public/assets/ui use:
    /assets/ui/studyword.png, /assets/ui/pig.png, /assets/ui/gardenword.png
*/

const Navbar: React.FC<NavbarProps> = ({ coins, userName, onLogout }) => {
  return (
    <header className="main-header">
      <div className="left-section">
        <div className="tabs-wrapper" aria-label="Site navigation">
          {/* Study tab (clickable) */}
          <Link to="/study" className="logo-tab logo-tab-study" aria-label="Go to Study">
            <img src="/studyword.png" alt="Study" className="logo-tab-img" />
          </Link>

          {/* Pig / center (non-clickable, larger, flush to navbar, may overlap) */}
          <div className="logo-tab logo-tab-pig" aria-hidden="true">
            <img src="/pig.png" alt="" className="logo-tab-img pig-img" />
          </div>

          {/* Garden tab (clickable) */}
          <Link to="/garden" className="logo-tab logo-tab-garden" aria-label="Go to Garden">
            <img src="/gardenword.png" alt="Garden" className="logo-tab-img" />
          </Link>
        </div>
      </div>

      <div className="right-section">
        <nav className="right-nav" aria-label="Right-side navigation">
          <Link to="/leaderboard/study" className="nav-link leaderboard-link">
            Leaderboard
          </Link>
        </nav>

        <div className="piggy-bank" title="Coins Icon">
          <img src="/piggybank.png" className="piggy-icon" alt="" />
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