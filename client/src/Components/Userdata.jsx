import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../Styles/Userdata.css";
import { User, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

const Userdata = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("userData");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.status === "Approved") {
          if (parsed.role === "Organizer") {
            navigate("/events/all", { replace: true });
          } else {
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

    if (fullName.trim().length < 3) {
      setError("Name must be at least 3 characters");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");

      const res = await fetch("https://gdg-a5ba.onrender.com/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: fullName.trim() }),
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
        setError(data.message || "Something went wrong");
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
          <div className="input-group">
            <label className="input-label">
              Full Name <span className="required-star">*</span>
            </label>
            <div className={`input-field-wrapper ${error ? "input-error" : ""}`}>
              <User className="field-icon" size={19} />
              <input
                type="text"
                placeholder="e.g. Ahmad Salameh"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>
            {error && (
              <span className="error-message">
                <AlertCircle size={13} /> {error}
              </span>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="spinner" size={18} />
                <span>Checking in...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
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