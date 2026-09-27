const { User, Event } = require("../models/Model");

// ==========================================
// USER CONTROLLERS
// ==========================================

// @desc    Register or Log In using just Full Name
// @route   POST /api/users
const saveUserData = async (req, res) => {
  try {
    const { fullName } = req.body;

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }



    const trimmedName = fullName.trim();

    // Check if user already exists
    let user = await User.findOne({
      fullName: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (!user) {
      // First time registration: Set as Pending
      user = await User.create({
        fullName: trimmedName,
        status: "Pending",
        campus: "",
        role: "",
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

// @desc    Get status of a specific user (used by Pending page polling)
// @route   GET /api/users/:id/status
const getUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (for the Admin Management page)
// @route   GET /api/users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

    // In Controller.js
  const getEventById = async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ success: false, message: "Event not found" });
      }
      return res.status(200).json({ success: true, data: event });
    } catch (error) {
      return res.status(500).json({ success: false, error: error.message });
    }
  };

// @desc    Assign Campus & Role to a User, and set Status to Approved
// @route   PUT /api/users/:id
const updateUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { campus, role, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (campus !== undefined) user.campus = campus;
    if (role !== undefined) user.role = role;
    if (status !== undefined) user.status = status;

    // Auto-approve if both campus and role are selected
    if (user.campus && user.role) {
      user.status = "Approved";
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// EVENT CONTROLLERS
// ==========================================
const getEventsByCampus = async (req, res) => {
  try {
    const { campus, role } = req.query;

    let filter = {};
    if (role === "Organizer" && (!campus || campus === "All")) {
      filter = {};
    } else if (campus && ["Ramallah", "Jenin"].includes(campus)) {
      filter = { campus };
    } else {
      return res.status(400).json({
        success: false,
        message: "A valid campus (Ramallah or Jenin) query is required",
      });
    }

    const events = await Event.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { name, description, date, campus, role } = req.body;

    if (role !== "Leader" && role !== "Organizer") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only leaders and organizers can create events",
      });
    }

    if (!name || !description || !campus) {
      return res.status(400).json({
        success: false,
        message: "name, description, and campus are required",
      });
    }

    const colors = [
      "note-yellow",
      "note-green",
      "note-blue",
      "note-pink",
      "note-purple",
    ];
    const colorClass = colors[Math.floor(Math.random() * colors.length)];

    const newEvent = await Event.create({
      name,
      description,
      date: date || "",
      campus,
      colorClass,
      sponsors: [],
    });

    return res.status(201).json({
      success: true,
      data: newEvent,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, date, campus, role } = req.body;

    if (role !== "Leader" && role !== "Organizer") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only leaders and organizers can update events",
      });
    }

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    if (name !== undefined) event.name = name;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (campus !== undefined && role === "Organizer") event.campus = campus;

    await event.save();

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (role !== "Leader" && role !== "Organizer") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only leaders and organizers can delete events",
      });
    }

    const event = await Event.findByIdAndDelete(id);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// SPONSOR CONTROLLERS
// ==========================================
const addSponsor = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, status, addedBy } = req.body;

    if (!name || !contact) {
      return res.status(400).json({
        success: false,
        message: "Name and contact info are required",
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
      addedBy: addedBy || "Anonymous Member",
    });

    await event.save();

    return res.status(201).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

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

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

const deleteSponsor = async (req, res) => {
  try {
    const { eventId, sponsorId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Event not found" });
    }

    event.sponsors.pull(sponsorId);
    await event.save();

    return res.status(200).json({ success: true, data: event });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
  
};



module.exports = {
  // Users
  saveUserData,
  getUserStatus,
  getAllUsers,
  updateUserDetails,
  deleteUser,
  // Events
  getEventsByCampus,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  // Sponsors
  addSponsor,
  updateSponsor,
  deleteSponsor,
};