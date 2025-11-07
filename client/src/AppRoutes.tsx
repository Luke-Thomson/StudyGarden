import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import StudyPage from "./pages/StudyPage";
import GardenPage from "./pages/GardenPage";
import AuthPage from "./pages/AuthPage";
import Navbar from "./components/ui/Navbar";

interface AppRoutesProps {
  isAuthenticated: boolean;
  onLogin: () => void;
  coins: number;
}

const AppRoutes: React.FC<AppRoutesProps> = ({ isAuthenticated, onLogin, coins }) => {
  const navigate = useNavigate();
  const handleNavbarNavigate = (page: "study" | "garden") => {
    navigate("/" + page);
  };

  return (
    <>
      {isAuthenticated && (
        <Navbar onNavigate={handleNavbarNavigate} coins={coins} />
      )}
      <Routes>
        {!isAuthenticated ? (
          <Route path="*" element={<AuthPage onLoginSuccess={onLogin} />} />
        ) : (
          <>
            <Route path="/" element={<Navigate to="/study" replace />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/garden" element={<GardenPage />} />
            <Route path="*" element={<Navigate to="/study" replace />} />
          </>
        )}
      </Routes>
    </>
  );
};

export default AppRoutes;