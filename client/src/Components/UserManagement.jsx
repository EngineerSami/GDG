import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  ShieldCheck,
  MapPin,
  Trash2,
  CheckCircle,
  Clock,
  ArrowLeft,
  Loader2,
  Crown,
} from "lucide-react";
import "../Styles/UserManagement.css";

const API_BASE_URL = "http://localhost:5000/api/users";

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_BASE_URL);
      const result = await res.json();
      if (res.ok) {
        setUsers(result.data || []);
      }
    } catch (err) {
      alert("Error loading users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdate = async (id, fields) => {
    try {
      setSavingId(id);
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const result = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === id ? result.data : u))
        );
      } else {
        alert(result.message || "Failed to update");
      }
    } catch (err) {
      alert("Error saving update");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== id));
      }
    } catch (err) {
      alert("Error deleting user");
    }
  };

  return (
    <div className="management-wrapper">
      <header className="management-header">
        <div className="title-section">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1>Member Identification & Permissions</h1>
            <p>Review users, identify their campus, and assign their ranks</p>
          </div>
        </div>

        <div className="stats-pill">
          <Users size={16} />
          <span>Total: {users.length} Users</span>
        </div>
      </header>

      {loading ? (
        <div className="center-loader">
          <Loader2 className="spinner" size={36} />
          <p>Loading members...</p>
        </div>
      ) : (
        <div className="table-card">
          <table className="users-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Status</th>
                <th>Assigned Campus</th>
                <th>Assigned Rank / Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isPending = u.status === "Pending";
                return (
                  <tr key={u._id} className={isPending ? "row-pending" : ""}>
                    <td className="user-name-cell">
                      <strong>{u.fullName}</strong>
                      <span className="join-date">
                        Joined {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                    </td>

                    <td>
                      <span className={`status-tag ${u.status.toLowerCase()}`}>
                        {isPending ? (
                          <Clock size={12} />
                        ) : (
                          <CheckCircle size={12} />
                        )}
                        {u.status}
                      </span>
                    </td>

                    <td>
                      <select
                        className="select-box"
                        value={u.campus || ""}
                        onChange={(e) =>
                          handleUpdate(u._id, { campus: e.target.value })
                        }
                      >
                        <option value="" disabled>
                          Select Campus...
                        </option>
                        <option value="Ramallah">Ramallah</option>
                        <option value="Jenin">Jenin</option>
                      </select>
                    </td>

                    <td>
                      <select
                        className="select-box"
                        value={u.role || ""}
                        onChange={(e) =>
                          handleUpdate(u._id, { role: e.target.value })
                        }
                      >
                        <option value="" disabled>
                          Select Rank...
                        </option>
                        <option value="Member">Member</option>
                        <option value="Leader">Leader</option>
                        <option value="Organizer">Organizer (All Access)</option>
                      </select>
                    </td>

                    <td>
                      <div className="action-buttons">
                        {savingId === u._id && (
                          <Loader2 className="spinner" size={16} />
                        )}
                        <button
                          className="delete-user-btn"
                          title="Delete User"
                          onClick={() => handleDelete(u._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;