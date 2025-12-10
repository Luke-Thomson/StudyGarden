import {useEffect, useMemo, useState} from "react";
import AppRoutes from "./AppRoutes";
import api from "./api";
import type {Subject, UserProfile} from "./types";

function App() {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem("sg_token"));
    const [user, setUser] = useState<UserProfile | null>(null);
    const [coins, setCoins] = useState(0);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [checkingAuth, setCheckingAuth] = useState(true);
    const [loadingProfile, setLoadingProfile] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isAuthenticated = useMemo(() => Boolean(token), [token]);
    const loadProfile = async (activeToken: string) => {
        setLoadingProfile(true);
        setError(null);
        try {
            const [me, balance, mySubjects] = await Promise.all([
                api.me(activeToken),
                api.wallet(activeToken),
                api.subjects(activeToken),
            ]);
            setUser(me);
            setCoins(balance);
            setSubjects(mySubjects);
        } catch (err: any) {
            setError(err?.message ?? "Unable to load profile");
            await handleLogout();
        } finally {
            setCheckingAuth(false);
            setLoadingProfile(false);
        }
    };
    useEffect(() => {
        if (!token) {
            setUser(null);
            setCoins(0);
            setSubjects([]);
            setCheckingAuth(false);
            return;
        }
        loadProfile(token);
    }, [token]);
    const handleLogin = async (email: string, password: string) => {
        setError(null);
        const res = await api.login(email, password);
        localStorage.setItem("sg_token", res.token);
        setToken(res.token);
    };

    const handleRegister = async (fullName: string, email: string, password: string) => {
        setError(null);
        await api.register(fullName, email, password);
        await handleLogin(email, password);
    };

    const handleLogout = async () => {
        if (token) {
            try {
                await api.logout(token);
            } catch (e) {
                // ignore logout errors
            }
        }
        localStorage.removeItem("sg_token");
        setToken(null);
        setUser(null);
        setCoins(0);
        setSubjects([]);
    };
    const refreshWallet = async () => {
        if (!token) return;
        const balance = await api.wallet(token);
        setCoins(balance);
    };
    const refreshSubjects = async () => {
        if (!token) return;
        const updated = await api.subjects(token);
        setSubjects(updated);
    };
    const createSubject = async (title: string) => {
        if (!token) return null;
        const created = await api.createSubject(token, title);
        setSubjects((prev) => [...prev, created]);
        return created as Subject;
    };
    return (
        <div className="app-layout" style={{display: "flex", flexDirection: "column", minHeight: "100vh"}}>
            <div style={{flex: 1, display: "flex", flexDirection: "column"}}>
                <AppRoutes
                    isAuthenticated={isAuthenticated}
                    token={token}
                    coins={coins}
                    user={user}
                    checkingAuth={checkingAuth}
                    loadingProfile={loadingProfile}
                    authError={error}
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onLogout={handleLogout}
                    onWalletRefresh={refreshWallet}
                    subjects={subjects}
                    onSubjectsRefresh={refreshSubjects}
                    onSubjectCreate={createSubject}
                />
            </div>
        </div>
    );
}
export default App;