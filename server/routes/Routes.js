const express = require("express");
const router = express.Router();
const { sendNewEventNotification } = require("../utils/mailer");

const {
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
} = require("../controllers/Controller");

// Authentication & Users
router.get("/test-email", async (req, res) => {
  try {
    const testRecipient = req.query.to || process.env.EMAIL_USER;

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({
        success: false,
        error: "Missing EMAIL_USER or EMAIL_PASS environment variables.",
      });
    }

    const result = await sendNewEventNotification([testRecipient], {
      name: "Diagnostic Test Event",
      description: "Testing Nodemailer configuration on Render",
      date: "2026-09-29",
      campus: "Ramallah",
    });

    return res.status(200).json({
      success: true,
      message: `Test email sent to ${testRecipient}`,
      result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
});
router.post("/users/login", loginUser);
router.post("/users/register", registerUser);
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

// Events
router.get("/events", getEvents);
router.post("/events", createEvent);
router.put("/events/:id", updateEvent);
router.delete("/events/:id", deleteEvent);

// Sponsors
router.post("/events/:id/sponsors", addSponsor);
router.put("/events/:eventId/sponsors/:sponsorId", updateSponsor);
router.delete("/events/:eventId/sponsors/:sponsorId", deleteSponsor);

// Chat Messages
router.get("/messages", getCampusMessages);

module.exports = router;