import {useState} from "react";

interface LoginFormProps {
    onSuccess: (email: string, password: string) => Promise<void>;
    loading?: boolean;
    serverError?: string;
}

const LoginForm: React.FC<LoginFormProps> = ({onSuccess, loading = false, serverError}) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!email || !password) {
            setError("Email and password are required");
            return;
        }
        try {
            setSubmitting(true);
            await onSuccess(email, password);
        } catch (err: any) {
            setError(err?.message ?? "Login failed");
        } finally {
            setSubmitting(false);
        }
    };
    const disabled = submitting || loading;
    return (
        <form className="login-form" onSubmit={handleSubmit}>
            {(error || serverError) && (
                <div className="auth-error" role="alert">{error ?? serverError}</div>
            )}
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                autoComplete="username"
                disabled={disabled}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                autoComplete="current-password"
                disabled={disabled}
            />
            <button type="submit" className="login-btn" disabled={disabled}>
                {disabled ? "Signing in…" : "Log In"}
            </button>
        </form>
    );
};
export default LoginForm;