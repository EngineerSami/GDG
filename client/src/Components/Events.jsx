import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import "../Styles/Events.css";
import {
  Calendar,
  Plus,
  Trash2,
  Edit2,
  X,
  Building2,
  Phone,
  Mail,
  UserCheck,
  MapPin,
  AlertCircle,
  Loader2,
  Crown,
  LogOut,
  User as UserIcon,
} from "lucide-react";

const BACKEND_URL = "https://gdg-a5ba.onrender.com";
const API_BASE_URL = `${BACKEND_URL}/api/events`;

const socket = io(BACKEND_URL);

const SPONSOR_STATUSES = [
  "Suggestion",
  "Awaiting Response",
  "No Response",
  "Rejected",
  "Approved",
];

const Events = () => {
  const { campusName } = useParams();
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("userData") ||
      '{"fullName":"Guest","campus":"Ramallah","role":"Member","status":"Approved"}'
  );

  const isOrganizer = user.role === "Organizer";
  const isLeader = user.role === "Leader";
  const hasEventAdminRights = isOrganizer || isLeader;

  // Selected campus filter for Organizers
  const [organizerFilter, setOrganizerFilter] = useState("All");

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);

  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    date: "",
    campus: user.campus || "Ramallah",
  });

  const [sponsorForm, setSponsorForm] = useState({
    _id: null,
    name: "",
    contact: "",
    status: "Suggestion",
  });
  const [isEditingSponsor, setIsEditingSponsor] = useState(false);

  // Fetch Events
  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      let query = "";
      if (isOrganizer) {
        query = `?role=Organizer&campus=${organizerFilter}`;
      } else {
        const activeCampus =
          campusName?.toLowerCase() === "jenin" ? "Jenin" : "Ramallah";
        query = `?campus=${activeCampus}&role=${user.role}`;
      }

      const response = await fetch(`${API_BASE_URL}${query}`);
      const result = await response.json();

      if (response.ok) {
        setEvents(result.data || []);
      } else {
        setErrorMessage(result.message || "Failed to fetch events");
      }
    } catch (err) {
      setErrorMessage("Network error: Backend server unreachable");
    } finally {
      setIsLoading(false);
    }
  }, [campusName, isOrganizer, organizerFilter, user.role]);

  // Initial fetch and Real-time Socket.IO listeners
  useEffect(() => {
    fetchEvents();

    socket.on("event_created", (newEvent) => {
      if (isOrganizer) {
        if (organizerFilter === "All" || organizerFilter === newEvent.campus) {
          setEvents((prev) => [newEvent, ...prev]);
        }
      } else {
        const activeCampus =
          campusName?.toLowerCase() === "jenin" ? "Jenin" : "Ramallah";
        if (newEvent.campus === activeCampus) {
          setEvents((prev) => [newEvent, ...prev]);
        }
      }
    });

    socket.on("event_updated", (updatedEvent) => {
      setEvents((prev) =>
        prev.map((ev) => (ev._id === updatedEvent._id ? updatedEvent : ev))
      );
      setSelectedEvent((curr) =>
        curr && curr._id === updatedEvent._id ? updatedEvent : curr
      );
    });

    socket.on("event_deleted", (deletedId) => {
      setEvents((prev) => prev.filter((ev) => ev._id !== deletedId));
      setSelectedEvent((curr) => (curr && curr._id === deletedId ? null : curr));
    });

    return () => {
      socket.off("event_created");
      socket.off("event_updated");
      socket.off("event_deleted");
    };
  }, [fetchEvents, isOrganizer, organizerFilter, campusName]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate("/", { replace: true });
  };

  // Event handlers
  const handleOpenEventModal = (eventToEdit = null) => {
    if (!hasEventAdminRights) return;
    if (eventToEdit) {
      setEditingEvent(eventToEdit);
      setEventForm({
        name: eventToEdit.name,
        description: eventToEdit.description,
        date: eventToEdit.date || "",
        campus: eventToEdit.campus,
      });
    } else {
      setEditingEvent(null);
      setEventForm({
        name: "",
        description: "",
        date: "",
        campus:
          isOrganizer && organizerFilter !== "All"
            ? organizerFilter
            : user.campus || "Ramallah",
      });
    }
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!hasEventAdminRights) return;

    try {
      const endpoint = editingEvent
        ? `${API_BASE_URL}/${editingEvent._id}`
        : API_BASE_URL;
      const method = editingEvent ? "PUT" : "POST";

      const payload = {
        ...eventForm,
        role: user.role,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        if (editingEvent) {
          setEvents((prev) =>
            prev.map((ev) => (ev._id === editingEvent._id ? result.data : ev))
          );
        } else {
          setEvents((prev) => [result.data, ...prev]);
        }
        setIsEventModalOpen(false);
      } else {
        alert(result.message || "Failed to save event");
      }
    } catch (err) {
      alert("Error contacting server");
    }
  };

  const handleDeleteEvent = async (id, e) => {
    e.stopPropagation();
    if (!hasEventAdminRights) return;
    if (!window.confirm("Permanently delete this event?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: user.role }),
      });

      const result = await res.json();
      if (res.ok) {
        setEvents((prev) => prev.filter((ev) => ev._id !== id));
        if (selectedEvent?._id === id) setSelectedEvent(null);
      } else {
        alert(result.message || "Failed to delete");
      }
    } catch (err) {
      alert("Error contacting server");
    }
  };

  // Sponsor handlers
  const handleSaveSponsor = async (e) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      let endpoint = `${API_BASE_URL}/${selectedEvent._id}/sponsors`;
      let method = "POST";

      if (isEditingSponsor) {
        endpoint = `${API_BASE_URL}/${selectedEvent._id}/sponsors/${sponsorForm._id}`;
        method = "PUT";
      }

      const payload = {
        ...sponsorForm,
        addedBy: user.fullName || "Anonymous Member",
      };

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok) {
        setEvents((prev) =>
          prev.map((ev) => (ev._id === selectedEvent._id ? result.data : ev))
        );
        setSelectedEvent(result.data);
        setSponsorForm({
          _id: null,
          name: "",
          contact: "",
          status: "Suggestion",
        });
        setIsEditingSponsor(false);
      } else {
        alert(result.message || "Failed to save sponsor");
      }
    } catch (err) {
      alert("Error contacting server");
    }
  };

  const handleEditSponsorInit = (sponsor) => {
    setSponsorForm(sponsor);
    setIsEditingSponsor(true);
  };

  const handleDeleteSponsor = async (sponsorId) => {
    if (!window.confirm("Remove this sponsor?")) return;

    try {
      const res = await fetch(
        `${API_BASE_URL}/${selectedEvent._id}/sponsors/${sponsorId}`,
        { method: "DELETE" }
      );

      const result = await res.json();
      if (res.ok) {
        setEvents((prev) =>
          prev.map((ev) => (ev._id === selectedEvent._id ? result.data : ev))
        );
        setSelectedEvent(result.data);
      } else {
        alert(result.message || "Failed to delete sponsor");
      }
    } catch (err) {
      alert("Error contacting server");
    }
  };

  return (
    <div className="events-dashboard">
      {/* Top Header */}
      <header className="events-header">
        <div className="header-left">
          <h1>Community Events</h1>
          <div className="header-tags">
            {isOrganizer ? (
              <span className="role-pill organizer">
                <Crown size={14} /> Organizer (All Permissions)
              </span>
            ) : (
              <>
                <span className="location-pill">
                  <MapPin size={14} /> {user.campus} Campus
                </span>
                <span className={`role-pill ${user.role?.toLowerCase()}`}>
                  <UserCheck size={14} /> {user.role} View
                </span>
              </>
            )}
          </div>
        </div>

        <div className="header-actions">
          {/* Organizer Campus Selector */}
          {isOrganizer && (
            <div className="campus-toggle">
              <button
                className={organizerFilter === "All" ? "active" : ""}
                onClick={() => setOrganizerFilter("All")}
              >
                All Campuses
              </button>
              <button
                className={organizerFilter === "Ramallah" ? "active" : ""}
                onClick={() => setOrganizerFilter("Ramallah")}
              >
                Ramallah
              </button>
              <button
                className={organizerFilter === "Jenin" ? "active" : ""}
                onClick={() => setOrganizerFilter("Jenin")}
              >
                Jenin
              </button>
            </div>
          )}

          {hasEventAdminRights && (
            <button
              className="add-event-btn"
              onClick={() => handleOpenEventModal()}
            >
              <Plus size={18} />
              <span>Create Sticky Note</span>
            </button>
          )}

          <button className="logout-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Board */}
      <main className="sticky-board">
        {isLoading ? (
          <div className="empty-board">
            <Loader2 className="spinner" size={28} />
            <p>Loading events...</p>
          </div>
        ) : errorMessage ? (
          <div className="empty-board">
            <AlertCircle color="#ea4335" size={32} />
            <p>{errorMessage}</p>
          </div>
        ) : events.length === 0 ? (
          <div className="empty-board">
            <p>No events found.</p>
            {hasEventAdminRights && (
              <span>Click "Create Sticky Note" to add one!</span>
            )}
          </div>
        ) : (
          <div className="board-grid">
            {events.map((ev) => (
              <div
                key={ev._id}
                className={`sticky-note ${ev.colorClass || "note-yellow"}`}
                onClick={() => setSelectedEvent(ev)}
              >
                <div className="note-pin"></div>

                {hasEventAdminRights && (
                  <div
                    className="note-actions"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="note-btn"
                      title="Edit Event"
                      onClick={() => handleOpenEventModal(ev)}
                    >
                      <Edit2 size={15} color="#3c4043" />
                    </button>
                    <button
                      className="note-btn delete"
                      title="Delete Event"
                      onClick={(e) => handleDeleteEvent(ev._id, e)}
                    >
                      <Trash2 size={15} color="#ea4335" />
                    </button>
                  </div>
                )}

                <div className="note-content">
                  {isOrganizer && (
                    <span className="note-campus-badge">{ev.campus}</span>
                  )}
                  <h3 className="note-title">{ev.name}</h3>
                  <p className="note-desc">{ev.description}</p>
                </div>

                <div className="note-footer">
                  <div className="note-date">
                    <Calendar size={14} />
                    <span>{ev.date || "Date Unspecified"}</span>
                  </div>
                  <div className="note-sponsor-tag">
                    <Building2 size={13} />
                    <span>{ev.sponsors?.length || 0} sponsors</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL 1: Create / Edit Event Note */}
      {isEventModalOpen && hasEventAdminRights && (
        <div className="modal-backdrop">
          <div className="modal-box">
            <div className="modal-header">
              <h2>{editingEvent ? "Edit Event Note" : "Create New Event"}</h2>
              <button
                className="close-btn"
                onClick={() => setIsEventModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="modal-form">
              <div className="form-group">
                <label>Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI & Cloud Camp"
                  value={eventForm.name}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, name: e.target.value })
                  }
                />
              </div>

              {/* Campus Selector for Organizers */}
              {isOrganizer && (
                <div className="form-group">
                  <label>Campus</label>
                  <select
                    value={eventForm.campus}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, campus: e.target.value })
                    }
                  >
                    <option value="Ramallah">Ramallah</option>
                    <option value="Jenin">Jenin</option>
                  </select>
                </div>
              )}

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe this event..."
                  value={eventForm.description}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Date (Optional)</label>
                <input
                  type="date"
                  value={eventForm.date}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, date: e.target.value })
                  }
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsEventModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingEvent ? "Update Sticky" : "Pin Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Sponsors Panel */}
      {selectedEvent && (
        <div className="modal-backdrop">
          <div className="modal-box sponsors-modal">
            <div className="modal-header">
              <div>
                <h2>{selectedEvent.name}</h2>
                <span className="event-meta-info">
                  <Calendar size={14} />{" "}
                  {selectedEvent.date || "Date Unspecified"} |{" "}
                  <MapPin size={14} /> {selectedEvent.campus}
                </span>
              </div>
              <button
                className="close-btn"
                onClick={() => setSelectedEvent(null)}
              >
                <X size={20} />
              </button>
            </div>

            <p className="sponsor-event-desc">{selectedEvent.description}</p>
            <hr className="divider" />

            <div className="sponsors-section">
              <div className="section-title">
                <h3>Sponsors & Partners</h3>
                <span className="count-badge">
                  {selectedEvent.sponsors?.length || 0}
                </span>
              </div>

              {/* Add / Edit Sponsor Form */}
              <form onSubmit={handleSaveSponsor} className="sponsor-inline-form">
                <input
                  type="text"
                  placeholder="Sponsor Name"
                  required
                  value={sponsorForm.name}
                  onChange={(e) =>
                    setSponsorForm({ ...sponsorForm, name: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Email or Phone"
                  required
                  value={sponsorForm.contact}
                  onChange={(e) =>
                    setSponsorForm({ ...sponsorForm, contact: e.target.value })
                  }
                />
                <select
                  value={sponsorForm.status}
                  onChange={(e) =>
                    setSponsorForm({ ...sponsorForm, status: e.target.value })
                  }
                >
                  {SPONSOR_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button type="submit" className="add-sponsor-btn">
                  {isEditingSponsor ? "Update" : "Add Sponsor"}
                </button>
                {isEditingSponsor && (
                  <button
                    type="button"
                    className="cancel-sponsor-btn"
                    onClick={() => {
                      setIsEditingSponsor(false);
                      setSponsorForm({
                        _id: null,
                        name: "",
                        contact: "",
                        status: "Suggestion",
                      });
                    }}
                  >
                    Cancel
                  </button>
                )}
              </form>

              {/* Sponsors List */}
              <div className="sponsors-list">
                {!selectedEvent.sponsors || selectedEvent.sponsors.length === 0 ? (
                  <p className="empty-sponsors">
                    No sponsors recorded yet. Submit a suggestion above!
                  </p>
                ) : (
                  selectedEvent.sponsors.map((sp) => (
                    <div key={sp._id} className="sponsor-card">
                      {/* TOP ROW: Sponsor Details */}
                      <div className="sponsor-info">
                        <h4>{sp.name}</h4>
                        <div className="sponsor-meta-row">
                          <span className="sponsor-contact">
                            {sp.contact?.includes("@") ? (
                              <Mail size={13} color="#5f6368" />
                            ) : (
                              <Phone size={13} color="#5f6368" />
                            )}
                            {sp.contact}
                          </span>
                          <span className="sponsor-added-by">
                            <UserIcon size={13} color="#1a73e8" />
                            <span>Added by:</span>
                            <strong>{sp.addedBy || "Member"}</strong>
                          </span>
                        </div>
                      </div>

                      {/* BOTTOM ROW: Status Badge on Left, Action Buttons on Right */}
                      <div className="sponsor-footer-row">
                        <span
                          className={`status-pill status-${(sp.status || "suggestion")
                            .toLowerCase()
                            .replace(/\s+/g, "-")}`}
                        >
                          {sp.status || "Suggestion"}
                        </span>

                        <div className="sponsor-item-actions">
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            onClick={() => handleEditSponsorInit(sp)}
                            title="Edit Sponsor"
                          >
                            <Edit2 size={15} color="#3c4043" />
                          </button>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteSponsor(sp._id)}
                            title="Delete Sponsor"
                          >
                            <Trash2 size={15} color="#ea4335" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;