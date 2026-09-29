const express = require("express");
const router = express.Router();
const {
  saveUserData,
  getUserStatus,
  getAllUsers,
  updateUserDetails,
  deleteUser,
  getEventsByCampus,
  createEvent,
  updateEvent,
  deleteEvent,
  addSponsor,
  updateSponsor,
  deleteSponsor,
  getEventById,
  getCampusMessages,
  loginUser,
  registerUser,
} = require("../controllers/Controller");

// --- USER ROUTES ---
router.route("/users")
  .get(getAllUsers)
  .post(saveUserData);

router.route("/users/:id")
  .put(updateUserDetails)
  .delete(deleteUser);

router.post("/users/login", loginUser);
router.post("/users/register", registerUser);

router.route("/users/:id/status")
  .get(getUserStatus);

// --- EVENT ROUTES ---

router.route("/messages").get(getCampusMessages);

router.route("/events")
  .get(getEventsByCampus)
  .post(createEvent);

router.route("/events/:id")
  .put(updateEvent)
  .delete(deleteEvent);

// --- SPONSOR ROUTES ---
router.route("/events/:id/sponsors")
  .post(addSponsor);

router.route("/events/:eventId/sponsors/:sponsorId")
  .put(updateSponsor)
  .delete(deleteSponsor);

router.route("/events/:id")
  .get(getEventById)
  .put(updateEvent)
  .delete(deleteEvent);

module.exports = router;