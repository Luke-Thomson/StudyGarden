import { useState } from "react";
import AppRoutes from "./AppRoutes";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Set to true for testing
  const [coins] = useState(0);

  const handleLogin = () => setIsAuthenticated(true);

  return (
    <div className="app-layout" style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <AppRoutes
          isAuthenticated={isAuthenticated}
          onLogin={handleLogin}
          coins={coins}
        />
      </div>
    </div>
  );
}

export default App;