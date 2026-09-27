import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, Crown, ShieldCheck, User } from "lucide-react";
import "../Styles/ChatWidget.css";

const BACKEND_URL = "https://gdg-a5ba.onrender.com";

const ChatWidget = ({ socket, currentUser }) => {
  const isOrganizer = currentUser?.role === "Organizer";

  // Active chat room: default to user's assigned campus, or "Ramallah"
  const [activeCampus, setActiveCampus] = useState(
    currentUser?.campus === "Jenin" ? "Jenin" : "Ramallah"
  );

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch initial message history whenever active campus changes
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/messages?campus=${activeCampus}`
        );
        const data = await res.json();
        if (res.ok) {
          setMessages(data.data || []);
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    };

    fetchHistory();

    // Join the current campus room
    socket.emit("join_campus_room", activeCampus);

    return () => {
      socket.emit("leave_campus_room", activeCampus);
    };
  }, [activeCampus, socket]);

  // Listen for live messages
  useEffect(() => {
    const handleReceive = (newMsg) => {
      if (newMsg.campus === activeCampus) {
        setMessages((prev) => [...prev, newMsg]);
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      }
    };

    socket.on("receive_message", handleReceive);

    return () => {
      socket.off("receive_message", handleReceive);
    };
  }, [activeCampus, isOpen, socket]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const payload = {
      senderName: currentUser?.fullName || "Member",
      senderRole: currentUser?.role || "Member",
      campus: activeCampus,
      text: inputText.trim(),
    };

    socket.emit("send_message", payload);
    setInputText("");
  };

  const getRoleBadge = (role) => {
    if (role === "Organizer") return <Crown size={12} className="badge-organizer" />;
    if (role === "Leader") return <ShieldCheck size={12} className="badge-leader" />;
    return null;
  };

  return (
    <div className="chat-widget-wrapper">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          className="chat-floating-btn"
          onClick={() => setIsOpen(true)}
          title="Open Campus Chat"
        >
          <MessageSquare size={24} />
          {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
        </button>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="chat-window">
          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-title">
              <MessageSquare size={18} />
              <span>Campus Chat</span>
            </div>

            <button
              className="chat-close-btn"
              onClick={() => setIsOpen(false)}
              title="Close chat"
            >
              <X size={18} />
            </button>
          </div>

          {/* Organizer Campus Switcher */}
          {isOrganizer && (
            <div className="chat-campus-tabs">
              <button
                type="button"
                className={activeCampus === "Ramallah" ? "active" : ""}
                onClick={() => setActiveCampus("Ramallah")}
              >
                Ramallah
              </button>
              <button
                type="button"
                className={activeCampus === "Jenin" ? "active" : ""}
                onClick={() => setActiveCampus("Jenin")}
              >
                Jenin
              </button>
            </div>
          )}

          {/* Non-organizer subheader showing their fixed campus */}
          {!isOrganizer && (
            <div className="chat-fixed-campus-bar">
              <span>{activeCampus} Campus Hub</span>
            </div>
          )}

          {/* Messages Body */}
          <div className="chat-body">
            {messages.length === 0 ? (
              <div className="chat-empty">
                <p>No messages yet in {activeCampus}.</p>
                <span>Say hello to the team!</span>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.senderName === currentUser?.fullName;
                return (
                  <div
                    key={msg._id || index}
                    className={`chat-msg-row ${isMe ? "mine" : "theirs"}`}
                  >
                    {!isMe && (
                      <div className="msg-sender-info">
                        <span className="sender-name">{msg.senderName}</span>
                        {getRoleBadge(msg.senderRole)}
                      </div>
                    )}
                    <div className="msg-bubble">
                      <p className="msg-text">{msg.text}</p>
                      <span className="msg-time">
                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString(
                          [],
                          { hour: "2-digit", minute: "2-digit" }
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form className="chat-footer" onSubmit={handleSendMessage}>
            <input
              type="text"
              placeholder={`Message ${activeCampus}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={!inputText.trim()}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatWidget;