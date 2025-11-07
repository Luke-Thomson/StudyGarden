import React from "react";
import { useNavigate } from "react-router-dom";
import piggyBankImg from "../assets/ui/piggybank.png"; // add your piggy bank image here
import "./MainPage.css";

interface MainPageProps {
  coins: number;
}

const MainPage: React.FC<MainPageProps> = ({ coins }) => {
  const navigate = useNavigate();

  return (
    <div className="main-bg">
      <header className="main-header">
        <div className="nav-options">
          <span className="nav-link" onClick={() => navigate("/study")}>
            Study
          </span>
          <span className="nav-link" onClick={() => navigate("/garden")}>
            Garden
          </span>
        </div>
        <div className="right-section">
          <span className="logo">
            Study <span className="logo-accent">Garden</span>
          </span>
          <div className="piggy-bank">
            <img src={piggyBankImg} alt="Piggy Bank" className="piggy-icon" />
            <span className="coin-count">{coins}</span>
          </div>
        </div>
      </header>
      <main className="main-content">
        {/* Main content for the selected page (study/garden) will go here */}
      </main>
    </div>
  );
};

export default MainPage;