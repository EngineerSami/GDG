import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from "lucide-react";
import "../Styles/Pending.css";

const Pending = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("userData");
    if (!raw) {
      navigate("/", { replace: true });
      return;
    }
    const parsed = JSON.parse(raw);
    setUser(parsed);

    if (parsed.status === "Approved" && parsed.campus) {
      if (parsed.role === "Organizer") {
        navigate("/events/all", { replace: true });
      } else {
        navigate(`/events/${parsed.campus.toLowerCase()}`, { replace: true });
      }
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/users/${parsed._id}/status`);
        const result = await res.json();

        if (res.ok && result.data) {
          const updated = result.data;
          if (updated.status === "Approved" && updated.campus && updated.role) {
            localStorage.setItem("userData", JSON.stringify(updated));
            clearInterval(interval);
            if (updated.role === "Organizer") {
              navigate("/events/all", { replace: true });
            } else {
              navigate(`/events/${updated.campus.toLowerCase()}`, { replace: true });
            }
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate("/", { replace: true });
  };

  if (!user) return null;

  return (
    <div className="pending-wrapper">
      <div className="pending-card">
        <div className="pending-icon-wrapper">
          <Clock className="pulse-icon" size={48} />
        </div>

        <h2>Access Pending Approval</h2>
        <p className="pending-name">
          Hello, <strong>{user.fullName}</strong>
        </p>
        <p className="pending-desc">
          Your account has been registered. An Organizer or Leader must assign
          your campus (Ramallah / Jenin) and role before you can enter the community board.
        </p>

        <div className="status-box">
          <span className="dot"></span>
          <span>Waiting for review... This page updates automatically.</span>
        </div>

        <button className="logout-btn secondary" onClick={handleLogout}>
          <LogOut size={16} />
          <span>Switch Account / Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Pending;