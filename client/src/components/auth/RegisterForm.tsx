import { useState } from "react";
interface RegisterFormProps {
    onSuccess: (fullName: string, email: string, password: string) => Promise<void>;
    loading?: boolean;
    serverError?: string;
}
const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, loading = false, serverError }) => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!fullName || !email || !password) {
            setError("Name, email, and password are required");
            return;
        }
        try {
            setSubmitting(true);
            await onSuccess(fullName, email, password);
        } catch (err: any) {
            setError(err?.message ?? "Registration failed");
        } finally {
            setSubmitting(false);
        }
    };
    const disabled = submitting || loading;
    return (
        <form className="login-form" onSubmit={handleSubmit}>
            {(error || serverError) && (
                <div className="auth-error" role="alert">
                    {error ?? serverError}
                </div>
            )}
            <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="login-input"
                autoComplete="name"
                disabled={disabled}
            />
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                autoComplete="email"
                disabled={disabled}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input"
                autoComplete="new-password"
                disabled={disabled}
            />
            <button type="submit" className="login-btn" disabled={disabled}>
                {disabled ? "Creating..." : "Create account"}
            </button>
        </form>
    );
};
export default RegisterForm;