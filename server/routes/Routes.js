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
} = require("../controllers/Controller");

// --- USER ROUTES ---
router.route("/users")
  .get(getAllUsers)
  .post(saveUserData);

router.route("/users/:id")
  .put(updateUserDetails)
  .delete(deleteUser);

router.route("/users/:id/status")
  .get(getUserStatus);

// --- EVENT ROUTES ---
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

module.exports = router;