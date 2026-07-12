// ─────────────────────────────────────────────────────────────
// Authentication Context & RBAC State Provider
// ─────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect } from "react";
import client, { getAccessToken, setAccessToken } from "../api/client.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadProfile = async () => {
        try {
            const res = await client.get("/auth/me");
            const profile = res.data.data;
            setUser(profile);
            
            // Map the API nested role permissions to a plain string array (e.g. ["vehicle:create", "trip:dispatch"])
            const perms = profile?.role?.permissions?.map(
                (p) => `${p.permission.resource}:${p.permission.action}`
            ) || [];
            
            setPermissions(perms);
            return profile;
        } catch (error) {
            setAccessToken(null);
            setUser(null);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = getAccessToken();
        if (token) {
            loadProfile();
        } else {
            setLoading(false);
        }

        // Listen for global logout events dispatched by the axios interceptor
        const handleLogoutEvent = () => {
            setUser(null);
            setPermissions([]);
            setAccessToken(null);
        };

        window.addEventListener("auth-logout", handleLogoutEvent);
        return () => {
            window.removeEventListener("auth-logout", handleLogoutEvent);
        };
    }, []);

    const login = async (email, password, role) => {
        setLoading(true);
        try {
            const res = await client.post("/auth/login", { email, password, role });
            const { accessToken } = res.data.data;
            setAccessToken(accessToken);
            await loadProfile();
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await client.post("/auth/logout");
        } catch (err) {
            // Log logout failures but continue local cleanup
        } finally {
            setAccessToken(null);
            setUser(null);
            setPermissions([]);
        }
    };

    const hasPerm = (resource, action) => {
        return permissions.includes(`${resource}:${action}`);
    };

    return (
        <AuthContext.Provider value={{ user, permissions, loading, login, logout, hasPerm, reloadProfile: loadProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }
    return context;
};
