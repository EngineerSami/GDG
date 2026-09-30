import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Clock, Loader2, LogOut } from "lucide-react";
import "../Styles/Pending.css";

const BACKEND_URL = "https://gdg-a5ba.onrender.com";
const socket = io(BACKEND_URL);

const Pending = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userData") || "{}");

  const routeApprovedUser = (approvedUser) => {
    localStorage.setItem("userData", JSON.stringify(approvedUser));

    if (approvedUser.role === "Organizer") {
      navigate("/events/all", { replace: true });
    } else if (approvedUser.campus) {
      navigate(`/events/${approvedUser.campus.toLowerCase()}`, { replace: true });
    } else {
      navigate("/events/ramallah", { replace: true });
    }
  };

  useEffect(() => {
    if (!user?._id) {
      navigate("/", { replace: true });
      return;
    }

    // 1. If already approved, redirect immediately
    if (user.status === "Approved") {
      routeApprovedUser(user);
      return;
    }

    // 2. Real-time approval listener via Socket.IO
    socket.on("user_updated", (updatedUser) => {
      if (updatedUser._id === user._id && updatedUser.status === "Approved") {
        routeApprovedUser(updatedUser);
      }
    });

    // 3. Fallback: Check backend every 4 seconds in case WebSocket drops
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/users`);
        const data = await res.json();
        if (res.ok && data.data) {
          const freshUser = data.data.find((u) => u._id === user._id);
          if (freshUser && freshUser.status === "Approved") {
            routeApprovedUser(freshUser);
          }
        }
      } catch (err) {
        console.error("Checking status error:", err);
      }
    }, 4000);

    return () => {
      socket.off("user_updated");
      clearInterval(interval);
    };
  }, [user?._id, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate("/", { replace: true });
  };

  return (
    <div className="pending-wrapper">
      <div className="pending-card">
        <div className="pending-icon-box">
          <Clock size={40} color="#b06000" />
        </div>
        <h2>Request Pending Approval</h2>
        <p>
          Hello <strong>{user.fullName || "Member"}</strong>, your request to
          join the GDG AAUP PR dashboard has been received.
        </p>
        <div className="status-note">
          <Loader2 className="spinner" size={16} />
          <span>Waiting for chapter organizer approval...</span>
        </div>
        <p className="auto-redirect-hint">
          This page will redirect automatically as soon as you are approved.
        </p>

        <button className="pending-logout-btn" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Sign In With Another Account</span>
        </button>
      </div>
    </div>
  );
};

export default Pending;