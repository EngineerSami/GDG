import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const storedUser = localStorage.getItem("userData");

  if (!storedUser) {
    // Not logged in at all -> redirect to sign-in page
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(storedUser);

    // If account is still pending, redirect to waiting room
    if (user.status === "Pending") {
      return <Navigate to="/pending" replace />;
    }

    // If user object has no valid name or status
    if (!user.fullName || user.status !== "Approved") {
      return <Navigate to="/" replace />;
    }
  } catch (error) {
    // If JSON parsing fails (corrupted data)
    localStorage.removeItem("userData");
    return <Navigate to="/" replace />;
  }

  // User is authenticated and approved -> render the page
  return children;
};

export default ProtectedRoute;