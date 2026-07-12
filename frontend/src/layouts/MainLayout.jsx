// ─────────────────────────────────────────────────────────────
// Main Layout — Core Navigation Shell
// ─────────────────────────────────────────────────────────────

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import {
    LayoutDashboard,
    Truck,
    Users,
    Route,
    Wrench,
    Fuel,
    BarChart3,
    Settings,
    LogOut,
    Search,
    Zap,
    Moon,
    Sun,
} from "lucide-react";

const MainLayout = () => {
    const { user, logout, hasPerm } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    // Map path names to friendly titles for header breadcrumbs
    const getPageTitle = () => {
        switch (location.pathname) {
            case "/":
            case "/dashboard":
                return "Dashboard";
            case "/vehicles":
                return "Vehicle Registry";
            case "/drivers":
                return "Drivers & Safety Profiles";
            case "/trips":
                return "Trip Dispatcher";
            case "/maintenance":
                return "Maintenance";
            case "/expenses":
                return "Fuel & Expenses";
            case "/analytics":
                return "Reports & Analytics";
            case "/settings":
                return "Settings & RBAC";
            default:
                return "TransitOps";
        }
    };

    const getInitials = (name) => {
        if (!name) return "";
        return name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
    };

    const navItems = [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true }, // General read
        { path: "/vehicles", label: "Fleet", icon: Truck, show: hasPerm("vehicle", "read") },
        { path: "/drivers", label: "Drivers", icon: Users, show: hasPerm("driver", "read") },
        { path: "/trips", label: "Trips", icon: Route, show: hasPerm("trip", "read") },
        { path: "/maintenance", label: "Maintenance", icon: Wrench, show: hasPerm("maintenance", "read") },
        { path: "/expenses", label: "Fuel & Expenses", icon: Fuel, show: hasPerm("expense", "read") || hasPerm("fuel", "read") },
        { path: "/analytics", label: "Analytics", icon: BarChart3, show: hasPerm("report", "read") },
        { path: "/settings", label: "Settings", icon: Settings, show: hasPerm("role", "read") },
    ];

    const activeStyle = "flex items-center px-4 py-3 text-pink-600 bg-pink-100/60 font-medium border-r-4 border-pink-500 transition-all";
    const inactiveStyle = "flex items-center px-4 py-3 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all";

    return (
        <div className="flex h-screen w-screen bg-cream-light overflow-hidden">
            {/* Left Sidebar */}
            <aside className="w-64 border-r border-neutral-200 bg-cream-dark flex flex-col justify-between select-none">
                <div className="flex flex-col flex-1 overflow-y-auto">
                    {/* Header Logo */}
                    <div className="p-6 flex items-center gap-3 border-b border-neutral-100">
                        <div className="h-10 w-10 bg-accent-pink rounded-xl flex items-center justify-center text-white shadow-sm shadow-pink-200">
                            <Zap className="h-5 w-5 fill-current" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-neutral-900 m-0 tracking-tight leading-none">
                                TransitOps
                            </h1>
                            <p className="text-[10px] text-neutral-400 font-medium mt-1 leading-none">
                                Smart Transport Operations
                            </p>
                        </div>
                    </div>

                    {/* Navigation Items */}
                    <nav className="flex-1 py-4 flex flex-col gap-1">
                        {navItems
                            .filter((item) => item.show)
                            .map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => (isActive ? activeStyle : inactiveStyle)}
                                >
                                    <item.icon className="mr-3 h-5 w-5 stroke-[2px]" />
                                    <span className="text-sm">{item.label}</span>
                                </NavLink>
                            ))}
                    </nav>
                </div>

                {/* Profile Card Footer */}
                {user && (
                    <div className="p-4 border-t border-neutral-200 bg-cream-dark flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-sm">
                                {getInitials(user.name)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-neutral-800 truncate m-0 leading-none">
                                    {user.name}
                                </h3>
                                <p className="text-xs text-neutral-500 truncate mt-1 leading-none font-medium">
                                    {user.role?.name}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => logout().then(() => navigate("/login"))}
                            className="flex items-center text-xs text-neutral-500 hover:text-red-500 font-medium cursor-pointer transition-colors w-full py-1 gap-2"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                )}
            </aside>

            {/* Right Panel Main Container */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Global Header */}
                <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-8 select-none">
                    <h2 className="text-xl font-bold text-neutral-900 m-0">
                        {getPageTitle()}
                    </h2>

                    {/* Header Search Bar */}
                    <div className="flex items-center gap-4">
                        <div className="relative w-80">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                <Search className="h-4 w-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="w-full pl-9 pr-4 py-2 text-sm bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 placeholder-neutral-400"
                            />
                        </div>

                        {/* Dark / Light Mode Toggle */}
                        <button
                            onClick={toggleTheme}
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            className="relative h-9 w-9 rounded-xl flex items-center justify-center border border-neutral-200 bg-cream-input hover:bg-neutral-100 transition-all duration-200 cursor-pointer shadow-sm"
                        >
                            <span className={`absolute transition-all duration-300 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`}>
                                <Sun className="h-4 w-4 text-amber-400" />
                            </span>
                            <span className={`absolute transition-all duration-300 ${!isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`}>
                                <Moon className="h-4 w-4 text-neutral-500" />
                            </span>
                        </button>

                        {/* User Metadata */}
                        {user && (
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <h4 className="text-sm font-semibold text-neutral-800 m-0 leading-none">
                                        {user.name}
                                    </h4>
                                    <p className="text-[10px] text-pink-500 font-semibold tracking-wider uppercase mt-1 leading-none">
                                        {user.role?.name}
                                    </p>
                                </div>
                                <div className="h-9 w-9 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                                    {getInitials(user.name)}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Subroute Page Content Panel */}
                <main className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
