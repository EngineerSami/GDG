import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Userdata from "./Components/Userdata";
import Pending from "./Components/Pending";
import Events from "./Components/Events";
import UserManagement from "./Components/UserManagement";
import ProtectedRoute from "./Components/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public login / registration route */}
        <Route path="/" element={<Userdata />} />

        {/* Pending waiting screen */}
        <Route path="/pending" element={<Pending />} />

        {/* PROTECTED: Campus events board */}
        <Route
          path="/events/:campusName"
          element={
            <ProtectedRoute>
              <Events />
            </ProtectedRoute>
          }
        />

        {/* Admin review page */}
        <Route path="/admin/users" element={<UserManagement />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;