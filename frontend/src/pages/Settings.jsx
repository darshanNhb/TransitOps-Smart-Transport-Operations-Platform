// ─────────────────────────────────────────────────────────────
// Settings Page — Preferences & Role-Based Access Controls
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Check, Loader2 } from "lucide-react";

const Settings = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: "" });

    // Preferences form states
    const [depotName, setDepotName] = useState(user?.organization?.name || "TransitOps Central Depot");
    const [currency, setCurrency] = useState("INR");
    const [distanceUnit, setDistanceUnit] = useState("km");

    const showToast = (message) => {
        setToast({ show: true, message });
        setTimeout(() => setToast({ show: false, message: "" }), 3000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate save delay
        setTimeout(() => {
            setLoading(false);
            showToast("Preferences updated successfully!");
        }, 1000);
    };

    // Static RBAC Permissions Matrix mapping mockups exactly
    const rbacGrid = [
        {
            role: "Fleet Manager",
            fleet: "check",
            drivers: "check",
            trips: "check",
            fuelExp: "check",
            analytics: "check",
        },
        {
            role: "Dispatcher",
            fleet: "view",
            drivers: "check",
            trips: "check",
            fuelExp: "dash",
            analytics: "dash",
        },
        {
            role: "Safety Officer",
            fleet: "view",
            drivers: "check",
            trips: "dash",
            fuelExp: "dash",
            analytics: "dash",
        },
        {
            role: "Financial Analyst",
            fleet: "view",
            drivers: "dash",
            trips: "dash",
            fuelExp: "check",
            analytics: "check",
        },
    ];

    const renderCell = (val) => {
        if (val === "check") {
            return (
                <div className="flex items-center justify-center">
                    <Check className="h-4 w-4 text-green-600 stroke-[3px]" />
                </div>
            );
        }
        if (val === "view") {
            return (
                <span className="text-blue-500 font-semibold text-xs tracking-wide">
                    view
                </span>
            );
        }
        return <span className="text-neutral-400 font-bold text-sm">—</span>;
    };

    return (
        <div className="flex flex-col gap-6 text-left">
            {/* Global toast */}
            {toast.show && (
                <div className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border bg-green-50 border-green-200 text-green-700 text-sm font-semibold select-none">
                    {toast.message}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* General Preferences Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="mb-6 border-b border-neutral-100 pb-3 select-none flex items-center gap-2">
                        <h3 className="text-base font-bold text-neutral-800 m-0">General</h3>
                        <span className="text-[10px] font-medium text-neutral-400 border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 rounded-md">(Demo Only)</span>
                    </div>

                    <form onSubmit={handleSave} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-neutral-600">Depot Name</label>
                            <input
                                type="text"
                                value={depotName}
                                onChange={(e) => setDepotName(e.target.value)}
                                className="w-full px-4 py-2.5 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 text-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-neutral-600">Currency</label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-4 py-2.5 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-neutral-700 text-sm cursor-pointer"
                            >
                                <option value="INR">INR — Indian Rupee</option>
                                <option value="EUR">EUR — Euro</option>
                                <option value="GBP">GBP — British Pound</option>
                            </select>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-semibold text-neutral-600">Distance Unit</label>
                            <select
                                value={distanceUnit}
                                onChange={(e) => setDistanceUnit(e.target.value)}
                                className="w-full px-4 py-2.5 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-neutral-700 text-sm cursor-pointer"
                            >
                                <option value="km">Kilometers (km)</option>
                                <option value="mi">Miles (mi)</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 py-2.5 px-6 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-200 text-white rounded-lg font-semibold text-xs cursor-pointer shadow-sm w-36 flex items-center justify-center gap-1.5 transition-colors"
                        >
                            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                            Save Changes
                        </button>
                    </form>
                </div>

                {/* Role-Based Access Matrix Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="mb-6 border-b border-neutral-100 pb-3 select-none">
                        <h3 className="text-base font-bold text-neutral-800 m-0">Role-Based Access (RBAC)</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-center text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-100 select-none text-[11px] text-neutral-400 uppercase tracking-wider font-bold">
                                    <th className="pb-3 text-left">Role</th>
                                    <th className="pb-3 px-2">Fleet</th>
                                    <th className="pb-3 px-2">Drivers</th>
                                    <th className="pb-3 px-2">Trips</th>
                                    <th className="pb-3 px-2">Fuel/Exp</th>
                                    <th className="pb-3 px-2">Analytics</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rbacGrid.map((row, idx) => (
                                    <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/20 transition-colors">
                                        <td className="py-4 text-left font-bold text-neutral-700 text-xs">
                                            {row.role}
                                        </td>
                                        <td className="py-4 px-2 select-none">{renderCell(row.fleet)}</td>
                                        <td className="py-4 px-2 select-none">{renderCell(row.drivers)}</td>
                                        <td className="py-4 px-2 select-none">{renderCell(row.trips)}</td>
                                        <td className="py-4 px-2 select-none">{renderCell(row.fuelExp)}</td>
                                        <td className="py-4 px-2 select-none">{renderCell(row.analytics)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
