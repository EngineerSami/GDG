const { User, Event, Message } = require("../models/Model"); // Adjust relative path if needed

// ==========================================
// USER AUTHENTICATION & REGISTRATION
// ==========================================

// @desc    Sign In with Username (Full Name) OR Email + Password
// @route   POST /api/users/login
const loginUser = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter your username or email",
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    const trimmedIdentifier = identifier.trim();
    const trimmedPassword = password.trim();

    // Find account by lowercase email or case-insensitive full name
    const user = await User.findOne({
      $or: [
        { email: trimmedIdentifier.toLowerCase() },
        { fullName: { $regex: new RegExp(`^${trimmedIdentifier}$`, "i") } },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Account not found. Please register first.",
      });
    }

    // Verify plaintext password
    if (user.password !== trimmedPassword) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new user (Join Request) with Pending status
// @route   POST /api/users/register
const registerUser = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // Check if account already exists
    const existingUser = await User.findOne({
      $or: [
        { email: trimmedEmail },
        { fullName: { $regex: new RegExp(`^${trimmedName}$`, "i") } },
      ],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this name or email already exists. Please sign in.",
      });
    }

    // Create user with Pending status
    const newUser = await User.create({
      fullName: trimmedName,
      email: trimmedEmail,
      password: trimmedPassword,
      status: "Pending",
      campus: "",
      role: "",
    });

    // Notify the admin review panel in real-time
    if (req.io) {
      req.io.emit("user_created", newUser);
    }

    return res.status(201).json({
      success: true,
      message: "Join request submitted. Awaiting organizer approval.",
      data: newUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// USER MANAGEMENT (ADMIN DASHBOARD)
// ==========================================

// @desc    Get all users (for Admin/Organizer user management)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve/Update user campus and role
// @route   PUT /api/users/:id
const updateUser = async (req, res) => {
  try {
    const { campus, role, status } = req.body;
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (campus !== undefined) user.campus = campus;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;

    await user.save();

    if (req.io) {
      req.io.emit("user_updated", user);
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user account (Reject request)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.io) {
      req.io.emit("user_deleted", id);
    }

    return res.status(200).json({ success: true, message: "User removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// EVENTS MANAGEMENT
// ==========================================

// @desc    Get events filtered by campus/role
// @route   GET /api/events?campus=Ramallah&role=Member
const getEvents = async (req, res) => {
  try {
    const { campus, role } = req.query;

    let filter = {};

    // Organizers can query "All" or filter down to a specific campus
    if (role === "Organizer") {
      if (campus && campus !== "All") {
        filter.campus = campus;
      }
    } else if (campus) {
      filter.campus = campus;
    }

    const events = await Event.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: events });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new event note (Leader or Organizer)
// @route   POST /api/events
const createEvent = async (req, res) => {
  try {
    const { name, description, date, campus, role } = req.body;

    if (role !== "Leader" && role !== "Organizer") {
      return res.status(403).json({
        success: false,
        message: "Only Leaders and Organizers are authorized to create events",
      });
    }

    if (!name || !description || !campus) {
      return res.status(400).json({
        success: false,
        message: "Name, description, and campus are required",
      });
    }

    const noteColors = ["note-yellow", "note-green", "note-blue", "note-pink", "note-purple"];
    const randomColor = noteColors[Math.floor(Math.random() * noteColors.length)];

    const newEvent = await Event.create({
      name,
      description,
      date: date || "",
      campus,
      colorClass: randomColor,
      sponsors: [],
    });

    if (req.io) {
      req.io.emit("event_created", newEvent);
    }

    return res.status(201).json({ success: true, data: newEvent });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update event details (Leader or Organizer)
// @route   PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, date, campus, role } = req.body;

    if (role !== "Leader" && role !== "Organizer") {
      return res.status(403).json({
        success: false,
        message: "Only Leaders and Organizers are authorized to edit events",
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (name) event.name = name;
    if (description) event.description = description;
    if (date !== undefined) event.date = date;
    if (campus) event.campus = campus;

    await event.save();

    if (req.io) {
      req.io.emit("event_updated", event);
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an event note (Leader or Organizer)
// @route   DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== "Leader" && role !== "Organizer") {
      return res.status(403).json({
        success: false,
        message: "Only Leaders and Organizers are authorized to delete events",
      });
    }

    const deletedEvent = await Event.findByIdAndDelete(id);
    if (!deletedEvent) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (req.io) {
      req.io.emit("event_deleted", id);
    }

    return res.status(200).json({ success: true, message: "Event deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// SPONSORS SUB-DOCUMENT OPERATIONS
// ==========================================

// @desc    Add a sponsor to an event
// @route   POST /api/events/:id/sponsors
const addSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, status, addedBy } = req.body;

    if (!name || !contact) {
      return res.status(400).json({
        success: false,
        message: "Sponsor name and contact details are required",
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    event.sponsors.push({
      name,
      contact,
      status: status || "Suggestion",
      addedBy: addedBy || "Member",
    });

    await event.save();

    if (req.io) {
      req.io.emit("event_updated", event);
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a sponsor inside an event
// @route   PUT /api/events/:eventId/sponsors/:sponsorId
const updateSponsor = async (req, res) => {
  try {
    const { eventId, sponsorId } = req.params;
    const { name, contact, status } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    const sponsor = event.sponsors.id(sponsorId);
    if (!sponsor) {
      return res.status(404).json({ success: false, message: "Sponsor not found" });
    }

    if (name) sponsor.name = name;
    if (contact) sponsor.contact = contact;
    if (status) sponsor.status = status;

    await event.save();

    if (req.io) {
      req.io.emit("event_updated", event);
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove a sponsor from an event
// @route   DELETE /api/events/:eventId/sponsors/:sponsorId
const deleteSponsor = async (req, res) => {
  try {
    const { eventId, sponsorId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    event.sponsors.pull(sponsorId);
    await event.save();

    if (req.io) {
      req.io.emit("event_updated", event);
    }

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// CAMPUS CHAT MESSAGES
// ==========================================

// @desc    Get recent chat messages for a campus
// @route   GET /api/messages?campus=Ramallah
const getCampusMessages = async (req, res) => {
  try {
    const { campus } = req.query;

    if (!campus || !["Ramallah", "Jenin"].includes(campus)) {
      return res.status(400).json({
        success: false,
        message: "A valid campus query (Ramallah or Jenin) is required",
      });
    }

    const messages = await Message.find({ campus })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: messages.reverse(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  loginUser,
  registerUser,
  getAllUsers,
  updateUser,
  deleteUser,
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  addSponsor,
  updateSponsor,
  deleteSponsor,
  getCampusMessages,
};