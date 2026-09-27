const mongoose = require("mongoose");

// --- USER SCHEMA ---
const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    campus: {
      type: String,
      enum: ["Ramallah", "Jenin", ""],
      default: "",
    },
    role: {
      type: String,
      enum: ["Member", "Leader", "Organizer", ""],
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved"],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

// --- SPONSOR SUB-SCHEMA ---
const sponsorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sponsor name is required"],
      trim: true,
    },
    contact: {
      type: String,
      required: [true, "Contact information is required"],
      trim: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        "Suggestion",
        "Awaiting Response",
        "No Response",
        "Rejected",
        "Approved",
      ],
      default: "Suggestion",
    },
    addedBy: {
      type: String,
      default: "Anonymous",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// --- EVENT SCHEMA ---
const eventSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Event name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Event description is required"],
      trim: true,
    },
    date: {
      type: String,
      default: "",
    },
    campus: {
      type: String,
      required: [true, "Campus is required"],
      enum: ["Ramallah", "Jenin"],
    },
    colorClass: {
      type: String,
      default: "note-yellow",
    },
    sponsors: [sponsorSchema],
  },
  {
    timestamps: true,
  }
);

// --- CHAT MESSAGE SCHEMA ---
const messageSchema = new mongoose.Schema(
  {
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    senderRole: {
      type: String,
      default: "Member",
    },
    campus: {
      type: String,
      required: true,
      enum: ["Ramallah", "Jenin"],
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);
const User = mongoose.model("User", userSchema);
const Event = mongoose.model("Event", eventSchema);

module.exports = {
  User,
  Event,
  Message,
};