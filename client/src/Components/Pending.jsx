import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useTheme } from "./ThemeContext";
import { Clock, LogOut, Loader2, Sun, Moon } from "lucide-react";
import "../Styles/Pending.css";

const BACKEND_URL = "https://gdg-a5ba.onrender.com";
const socket = io(BACKEND_URL);

const Pending = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("userData");
    if (!raw) {
      navigate("/", { replace: true });
      return;
    }

    const parsed = JSON.parse(raw);
    setCurrentUser(parsed);

    if (parsed.status === "Approved" && parsed.campus && parsed.role) {
      redirectToEvents(parsed);
      return;
    }

    const handleUserUpdate = (updatedUser) => {
      if (updatedUser._id === parsed._id) {
        if (updatedUser.status === "Approved") {
          localStorage.setItem("userData", JSON.stringify(updatedUser));
          redirectToEvents(updatedUser);
        }
      }
    };

    socket.on("user_updated", handleUserUpdate);

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/users`);
        const result = await res.json();
        if (res.ok && result.data) {
          const freshUser = result.data.find((u) => u._id === parsed._id);
          if (freshUser && freshUser.status === "Approved") {
            localStorage.setItem("userData", JSON.stringify(freshUser));
            redirectToEvents(freshUser);
          }
        }
      } catch (err) {
        console.error("Polling check failed", err);
      }
    }, 4000);

    return () => {
      socket.off("user_updated", handleUserUpdate);
      clearInterval(interval);
    };
  }, [navigate]);

  const redirectToEvents = (user) => {
    if (user.role === "Organizer") {
      navigate("/events/all", { replace: true });
    } else if (user.campus) {
      navigate(`/events/${user.campus.toLowerCase()}`, { replace: true });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate("/", { replace: true });
  };

  return (
    <div className="pending-wrapper">
      <div className="pending-theme-toggle">
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>

      <div className="pending-card">
        <div className="pending-icon-box">
          <Clock size={40} className="pending-clock-icon" />
        </div>

        <h2>Request Under Review</h2>
        <p className="pending-desc">
          Hello <strong>{currentUser?.fullName}</strong>, your account has been
          registered and is awaiting approval by a GDG AAUP Organizer.
        </p>

        <div className="pending-status-box">
          <Loader2 size={16} className="spinner" />
          <span>Listening for approval... You will be redirected automatically.</span>
        </div>

        <button className="pending-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Sign Out / Switch Account</span>
        </button>
      </div>
    </div>
  );
};

export default Pending;