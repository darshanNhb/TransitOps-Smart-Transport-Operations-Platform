// ─────────────────────────────────────────────────────────────
// Protected Route Guard — Role-Based Access Control
// ─────────────────────────────────────────────────────────────
// Restricts route rendering to authenticated sessions.
// Intercepts and blocks route mounting if the user's fetched
// permission set does not contain the required resource:action mappings.
// ─────────────────────────────────────────────────────────────

import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const Protected = ({ children, resource, action }) => {
    const { user, loading, hasPerm } = useAuth();

    if (loading) {
        return (
            <div className="flex h-screen w-screen items-center justify-center bg-cream-light text-neutral-800">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-pink border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // RBAC check
    if (resource && action && !hasPerm(resource, action)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return children;
};

export default Protected;
