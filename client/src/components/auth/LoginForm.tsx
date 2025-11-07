import { useState } from "react";

interface LoginFormProps {
  onSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add login logic here
    onSuccess();
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username or Email"
        value={username}
        onChange={e => setUsername(e.target.value)}
        className="login-input"
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="login-input"
        autoComplete="current-password"
      />
      <button type="submit" className="login-btn">Log In</button>
    </form>
  );
};

export default LoginForm;