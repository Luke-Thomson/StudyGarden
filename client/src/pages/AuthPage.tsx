import "./AuthPage.css";
import {useState} from "react";
import logo from "../assets/ui/logo.png";
import LoginForm from "../components/auth/LoginForm";

interface AuthPageProps {
    onLoginSuccess: (email: string, password: string) => Promise<void>;
    loading?: boolean;
    error?: string | null;
}

const AuthPage: React.FC<AuthPageProps> = ({onLoginSuccess, loading = false, error}) => {
    const [mode, setMode] = useState<"login" | "register">("login");
    return (
        <div className="auth-bg">
            <div className="auth-card">
                <img src={logo} alt="Study Garden Logo" className="auth-logo"/>
                <h1 className="auth-title">Welcome to Study Garden!</h1>
                {mode === "login" ? (
                    <>
                        <LoginForm onSuccess={onLoginSuccess} loading={loading} serverError={error ?? undefined}/>
                        <div className="auth-divider">or</div>
                        <button className="switch-btn" onClick={() => setMode("register")}>
                            Create an account
                        </button>
                    </>
                ) : (
                    <>
                        <div className="auth-divider">or</div>
                        <button className="switch-btn" onClick={() => setMode("login")}>
                            Already have an account? Sign in
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
export default AuthPage;