import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Userdata.css";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  UserPlus,
  LogIn,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "./ThemeContext";

const BACKEND_URL = "https://gdg-a5ba.onrender.com";

// Vector component rendering the GDG chevron bracket symbol
const GdgBracket = ({ direction = "left", className = "" }) => (
  <svg
    viewBox="0 0 100 120"
    fill="currentColor"
    className={`gdg-bracket-svg ${direction} ${className}`}
  >
    {direction === "left" ? (
      <path
        d="M80 15 C85 20, 85 28, 78 35 L42 60 L78 85 C85 92, 85 100, 80 105 C75 110, 67 110, 60 105 L15 70 C7 65, 7 55, 15 50 L60 15 C67 10, 75 10, 80 15 Z"
      />
    ) : (
      <path
        d="M20 15 C15 20, 15 28, 22 35 L58 60 L22 85 C15 92, 15 100, 20 105 C25 110, 33 110, 40 105 L85 70 C93 65, 93 55, 85 50 L40 15 C33 10, 25 10, 20 15 Z"
      />
    )}
  </svg>
);

const Userdata = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // Tab State: "login" or "register"
  const [activeTab, setActiveTab] = useState("login");

  // Form Fields
  const [identifier, setIdentifier] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check existing session
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("userData");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.status === "Approved") {
          if (parsed.role === "Organizer") {
            navigate("/events/all", { replace: true });
          } else if (parsed.campus) {
            navigate(`/events/${parsed.campus.toLowerCase()}`, { replace: true });
          }
          return;
        } else if (parsed?.status === "Pending") {
          navigate("/pending", { replace: true });
          return;
        }
      }
    } catch (err) {
      localStorage.removeItem("userData");
    } finally {
      setIsCheckingAuth(false);
    }
  }, [navigate]);

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError("");
    setPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (activeTab === "login") {
      if (!identifier.trim()) {
        setError("Please enter your username or email");
        return;
      }
      if (!password.trim()) {
        setError("Please enter your password");
        return;
      }

      try {
        setIsSubmitting(true);
        const res = await fetch(`${BACKEND_URL}/api/users/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password: password.trim(),
          }),
        });

        const data = await res.json();

        if (res.ok) {
          const user = data.data;
          localStorage.setItem("userData", JSON.stringify(user));

          if (user.status === "Approved" && user.campus && user.role) {
            if (user.role === "Organizer") {
              navigate("/events/all", { replace: true });
            } else {
              navigate(`/events/${user.campus.toLowerCase()}`, { replace: true });
            }
          } else {
            navigate("/pending", { replace: true });
          }
        } else {
          setError(data.message || "Invalid credentials");
        }
      } catch (err) {
        setError("Unable to connect to server");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // REGISTER
      if (!fullName.trim()) {
        setError("Please enter your full name");
        return;
      }
      if (!email.trim()) {
        setError("Please enter your email");
        return;
      }
      if (!password.trim()) {
        setError("Please create a password");
        return;
      }

      try {
        setIsSubmitting(true);
        const res = await fetch(`${BACKEND_URL}/api/users/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            password: password.trim(),
          }),
        });

        const data = await res.json();

        if (res.ok) {
          const user = data.data;
          localStorage.setItem("userData", JSON.stringify(user));
          navigate("/pending", { replace: true });
        } else {
          setError(data.message || "Registration failed");
        }
      } catch (err) {
        setError("Unable to connect to server");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (isCheckingAuth) return null;

  return (
    <div className="login-wrapper">
      {/* Floating Animated GDG Shapes */}
      <div className="floating-shapes-container" aria-hidden="true">
        <div className="bubble-shape shape-1"><GdgBracket direction="left" /></div>
        <div className="bubble-shape shape-2"><GdgBracket direction="right" /></div>
        <div className="bubble-shape shape-3"><GdgBracket direction="left" /></div>
        <div className="bubble-shape shape-4"><GdgBracket direction="right" /></div>
        <div className="bubble-shape shape-5"><GdgBracket direction="left" /></div>
        <div className="bubble-shape shape-6"><GdgBracket direction="right" /></div>
        <div className="bubble-shape shape-7"><GdgBracket direction="left" /></div>
        <div className="bubble-shape shape-8"><GdgBracket direction="right" /></div>
        <div className="bubble-shape shape-9"><GdgBracket direction="left" /></div>
        <div className="bubble-shape shape-10"><GdgBracket direction="right" /></div>
      </div>

      {/* Top Corner Dark Mode Button */}
      <div className="login-theme-toggle">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      <div className="login-card">
        {/* Top Header */}
        <div className="login-header">
          <div className="logo-container">
            <img
              src="https://i.ibb.co/RWGYDWC/image-2026-09-26-173025596-removebg-preview.png"
              alt="GDG Logo"
              className="brand-logo"
            />
          </div>
          <h2 className="title">Community Portal</h2>
          <p className="subtitle">
            {activeTab === "login"
              ? "Sign in to manage your campus events"
              : "Submit a request to join the PR team"}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "login" ? "active" : ""}`}
            onClick={() => handleTabSwitch("login")}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => handleTabSwitch("register")}
          >
            <UserPlus size={15} />
            <span>Join Request</span>
          </button>
        </div>

        {/* Form */}
        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {activeTab === "login" ? (
            /* SIGN IN FIELDS */
            <div className="input-group">
              <label className="input-label">
                Username or Email <span className="required-star">*</span>
              </label>
              <div className={`input-field-wrapper ${error && !identifier ? "input-error" : ""}`}>
                <User className="field-icon" size={19} />
                <input
                  type="text"
                  placeholder="Full name or email@address.com"
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    if (error) setError("");
                  }}
                />
              </div>
            </div>
          ) : (
            /* REGISTER FIELDS */
            <>
              <div className="input-group">
                <label className="input-label">
                  Full Name <span className="required-star">*</span>
                </label>
                <div className={`input-field-wrapper ${error && !fullName ? "input-error" : ""}`}>
                  <User className="field-icon" size={19} />
                  <input
                    type="text"
                    placeholder="e.g. Sami Daraghmeh"
                    value={fullName}
                    onChange={(e) => {
                      setFullName(e.target.value);
                      if (error) setError("");
                    }}
                  />
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">
                  Email Address <span className="required-star">*</span>
                </label>
                <div className={`input-field-wrapper ${error && !email ? "input-error" : ""}`}>
                  <Mail className="field-icon" size={19} />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                  />
                </div>
              </div>
            </>
          )}

          {/* Password */}
          <div className="input-group">
            <label className="input-label">
              Password <span className="required-star">*</span>
            </label>
            <div className={`input-field-wrapper ${error && !password ? "input-error" : ""}`}>
              <Lock className="field-icon" size={19} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder={activeTab === "login" ? "Enter your password" : "Create a password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="spinner" size={18} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{activeTab === "login" ? "Sign In" : "Send Join Request"}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Userdata;