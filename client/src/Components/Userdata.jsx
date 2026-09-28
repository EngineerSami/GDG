import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Userdata.css";
import { User, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

const BACKEND_URL = "https://gdg-a5ba.onrender.com";

const Userdata = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check if session exists on load
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("Please enter your full name");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch(`${BACKEND_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim(),
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
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Unable to connect to server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) return null;

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-container">
            <img
              src="https://i.ibb.co/RWGYDWC/image-2026-09-26-173025596-removebg-preview.png"
              alt="GDG Logo"
              className="brand-logo"
            />
          </div>
          <h2 className="title">Community Portal</h2>
          <p className="subtitle">Sign in to your GDG AAUP PR Account</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
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

          {/* Password */}
          <div className="input-group">
            <label className="input-label">
              Password <span className="required-star">*</span>
            </label>
            <div className={`input-field-wrapper ${error && !password ? "input-error" : ""}`}>
              <Lock className="field-icon" size={19} />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
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
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In / Register</span>
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