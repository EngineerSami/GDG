import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { useTheme } from "./ThemeContext";
import {
  Check,
  Trash2,
  Clock,
  CheckCircle2,
  Users,
  Search,
  Loader2,
  AlertCircle,
  Mail,
  Sun,
  Moon,
} from "lucide-react";
import "../Styles/UserManagement.css";

const BACKEND_URL = "https://gdg-a5ba.onrender.com";
const API_BASE_URL = `${BACKEND_URL}/api/users`;
const socket = io(BACKEND_URL);

const CAMPUS_OPTIONS = ["Ramallah", "Jenin"];
const ROLE_OPTIONS = [
  { label: "Member", value: "Member" },
  { label: "Leader", value: "Leader" },
  { label: "Organizer (All Access)", value: "Organizer" },
];

const UserManagement = () => {
  const { theme, toggleTheme } = useTheme();
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const res = await fetch(API_BASE_URL);
      const data = await res.json();

      if (res.ok) {
        setUsers(data.data || []);
      } else {
        setErrorMessage(data.message || "Failed to load user list");
      }
    } catch (err) {
      setErrorMessage("Network error: Backend server unreachable");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();

    socket.on("user_created", (newUser) => {
      setUsers((prev) => [newUser, ...prev]);
    });

    socket.on("user_updated", (updatedUser) => {
      setUsers((prev) =>
        prev.map((u) => (u._id === updatedUser._id ? updatedUser : u))
      );
    });

    socket.on("user_deleted", (deletedId) => {
      setUsers((prev) => prev.filter((u) => u._id !== deletedId));
    });

    return () => {
      socket.off("user_created");
      socket.off("user_updated");
      socket.off("user_deleted");
    };
  }, [fetchUsers]);

  const handleUserFieldChange = async (userId, field, value) => {
    try {
      setActionLoadingId(userId);

      const currentUser = users.find((u) => u._id === userId);
      if (!currentUser) return;

      const payload = {
        campus: field === "campus" ? value : currentUser.campus,
        role: field === "role" ? value : currentUser.role,
      };

      if (payload.campus && payload.role && currentUser.status === "Pending") {
        payload.status = "Approved";
      }

      const res = await fetch(`${API_BASE_URL}/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? data.data : u))
        );
      } else {
        alert(data.message || "Failed to update user");
      }
    } catch (err) {
      alert("Error contacting server");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApproveUser = async (user) => {
    if (!user.campus || !user.role) {
      alert("Please assign both Campus and Role first.");
      return;
    }

    try {
      setActionLoadingId(user._id);

      const res = await fetch(`${API_BASE_URL}/${user._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Approved" }),
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u._id === user._id ? data.data : u))
        );
      } else {
        alert(data.message || "Failed to approve user");
      }
    } catch (err) {
      alert("Error contacting server");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Permanently remove ${userName || "this user"}?`)) return;

    try {
      setActionLoadingId(userId);

      const res = await fetch(`${API_BASE_URL}/${userId}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
      } else {
        alert(data.message || "Failed to remove user");
      }
    } catch (err) {
      alert("Error contacting server");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="user-management-container">
      <div className="um-header">
        <div>
          <h2>User Administration</h2>
          <p>Review new join requests, grant campus roles, and manage permissions.</p>
        </div>

        <div className="um-filters">
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
          >
            {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="status-tabs">
            {["All", "Pending", "Approved"].map((st) => (
              <button
                key={st}
                className={statusFilter === st ? "active" : ""}
                onClick={() => setStatusFilter(st)}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="um-table-card">
        {isLoading ? (
          <div className="um-loading">
            <Loader2 className="spinner" size={30} />
            <p>Loading members...</p>
          </div>
        ) : errorMessage ? (
          <div className="um-empty">
            <AlertCircle size={32} color="#ea4335" />
            <p>{errorMessage}</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="um-empty">
            <Users size={32} color="var(--text-secondary)" />
            <p>No users found matching your filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="um-table">
              <thead>
                <tr>
                  <th>FULL NAME</th>
                  <th>STATUS</th>
                  <th>ASSIGNED CAMPUS</th>
                  <th>ASSIGNED RANK / ROLE</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isPending = u.status === "Pending";
                  const isActionLoading = actionLoadingId === u._id;

                  return (
                    <tr key={u._id} className={isPending ? "row-pending" : ""}>
                      <td>
                        <div className="user-name-col">
                          <strong className="user-fullname">{u.fullName}</strong>
                          {u.email && (
                            <span className="user-email">
                              <Mail size={12} />
                              {u.email}
                            </span>
                          )}
                          <span className="user-joined-date">
                            Joined{" "}
                            {new Date(u.createdAt || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className={`status-pill ${isPending ? "pending" : "approved"}`}>
                          {isPending ? (
                            <>
                              <Clock size={13} /> Pending
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={13} /> Approved
                            </>
                          )}
                        </span>
                      </td>

                      <td>
                        <select
                          className="um-select"
                          value={u.campus || ""}
                          disabled={isActionLoading}
                          onChange={(e) =>
                            handleUserFieldChange(u._id, "campus", e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Select Campus
                          </option>
                          {CAMPUS_OPTIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <select
                          className="um-select"
                          value={u.role || ""}
                          disabled={isActionLoading}
                          onChange={(e) =>
                            handleUserFieldChange(u._id, "role", e.target.value)
                          }
                        >
                          <option value="" disabled>
                            Select Role
                          </option>
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td>
                        <div className="um-actions-cell">
                          {isPending && (
                            <button
                              type="button"
                              className="action-btn approve"
                              title="Approve User"
                              disabled={isActionLoading}
                              onClick={() => handleApproveUser(u)}
                            >
                              <Check size={16} />
                            </button>
                          )}

                          <button
                            type="button"
                            className="action-btn delete"
                            title="Reject or Delete Member"
                            disabled={isActionLoading}
                            onClick={() => handleDeleteUser(u._id, u.fullName)}
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
    </div>
  );
};

export default UserManagement;