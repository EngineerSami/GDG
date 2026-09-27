import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Userdata from "./Components/Userdata";
import Pending from "./Components/Pending";
import Events from "./Components/Events";
import UserManagement from "./Components/UserManagement";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Userdata />} />

        <Route path="/pending" element={<Pending />} />

        <Route path="/events/:campusName" element={<Events />} />

        <Route path="/admin/users" element={<UserManagement />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;