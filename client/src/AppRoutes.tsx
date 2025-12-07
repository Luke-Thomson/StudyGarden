import { Routes, Route, Navigate } from "react-router-dom";
import StudyPage from "./pages/StudyPage";
import GardenPage from "./pages/GardenPage";
import AuthPage from "./pages/AuthPage";
import Navbar from "./components/ui/Navbar";
import type { Subject, UserProfile } from "./types";
interface AppRoutesProps {
    isAuthenticated: boolean;
    token: string | null;
    coins: number;
    user: UserProfile | null;
    checkingAuth: boolean;
    loadingProfile: boolean;
    authError: string | null;
    onLogin: (email: string, password: string) => Promise<void>;
    onLogout: () => Promise<void> | void;
    onWalletRefresh: () => Promise<void>;
    subjects: Subject[];
    onSubjectsRefresh: () => Promise<void>;
    onSubjectCreate: (title: string) => Promise<Subject | null>;
}
const AppRoutes: React.FC<AppRoutesProps> = ({
                                                 isAuthenticated,
                                                 token,
                                                 coins,
                                                 user,
                                                 checkingAuth,
                                                 loadingProfile,
                                                 authError,
                                                 onLogin,
                                                 onLogout,
                                                 onWalletRefresh,
                                                 subjects,
                                                 onSubjectsRefresh,
                                                 onSubjectCreate,
                                             }) => {
    if (checkingAuth) {
        return <div style={{ padding: "2rem" }}>Checking session…</div>;
    }
    return (
        <>
            {isAuthenticated && token && (
                <Navbar coins={coins} userName={user?.fullName ?? user?.email} onLogout={onLogout} />
            )}
            <Routes>
                {!isAuthenticated || !token ? (
                    <Route
                        path="*"
                        element={<AuthPage onLoginSuccess={onLogin} loading={loadingProfile} error={authError} />}
                    />
                ) : (
                    <>
                        <Route path="/" element={<Navigate to="/study" replace />} />
                        <Route
                            path="/study"
                            element={
                                <StudyPage
                                    token={token}
                                    subjects={subjects}
                                    onSubjectsRefresh={onSubjectsRefresh}
                                    onSubjectCreate={onSubjectCreate}
                                    onWalletRefresh={onWalletRefresh}
                                />
                            }
                        />
                        <Route
                            path="/garden"
                            element={<GardenPage token={token} onWalletRefresh={onWalletRefresh} />}
                        />
                        <Route path="*" element={<Navigate to="/study" replace />} />
                    </>
                )}
            </Routes>
        </>
    );
};
export default AppRoutes;