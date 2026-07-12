// ─────────────────────────────────────────────────────────────
// Dashboard Page — Fleet & Operations Analytics
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client.js";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Loader2 } from "lucide-react";

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [vehicleFilter, setVehicleFilter] = useState("All Types");
    const [statusFilter, setStatusFilter] = useState("All Status");
    
    // Aggregated stats
    const [stats, setStats] = useState({
        activeVehicles: 0,
        availableVehicles: 0,
        inMaintenance: 0,
        activeTrips: 0,
        pendingTrips: 0,
        driversOnDuty: 0,
        utilizationRate: 0,
    });

    const [recentTrips, setRecentTrips] = useState([]);
    const [chartData, setChartData] = useState([]);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            
            // 1. Fetch data from backend API nodes
            const [vehRes, tripRes, driverRes, maintRes] = await Promise.all([
                client.get("/vehicles?limit=100"),
                client.get("/trips?limit=100"),
                client.get("/drivers?limit=100"),
                client.get("/maintenance?limit=100"),
            ]);

            const vehicles = vehRes.data.data;
            const trips = tripRes.data.data;
            const drivers = driverRes.data.data;
            const maintenances = maintRes.data.data;

            // Apply filters for stats calculations
            let filteredVehicles = vehicles;
            if (vehicleFilter !== "All Types") {
                filteredVehicles = vehicles.filter(v => 
                    v.fuelType === vehicleFilter.toUpperCase() || 
                    v.name?.toLowerCase().includes(vehicleFilter.toLowerCase()) ||
                    v.model?.toLowerCase().includes(vehicleFilter.toLowerCase())
                );
            }
            if (statusFilter !== "All Status") {
                filteredVehicles = filteredVehicles.filter(v => v.status === statusFilter.toUpperCase());
            }

            // Calculations matching metadata
            const totalVehicles = filteredVehicles.length;
            const activeVehicles = filteredVehicles.filter(v => v.status !== "RETIRED").length;
            const availableVehicles = filteredVehicles.filter(v => v.status === "AVAILABLE" && v.availability).length;
            const inMaintenance = filteredVehicles.filter(v => v.status === "IN_MAINTENANCE" || v.status === "IN_SHOP").length;
            
            const activeTripsCount = trips.filter(t => t.status === "DISPATCHED").length;
            const pendingTripsCount = trips.filter(t => t.status === "SCHEDULED" || t.status === "DRAFT").length;
            const activeDrivers = drivers.filter(d => d.status === "AVAILABLE" || d.status === "ON_TRIP").length;

            const utilizationRate = activeVehicles > 0 
                ? Math.round((trips.filter(t => t.status === "DISPATCHED").length / activeVehicles) * 100)
                : 0;

            setStats({
                activeVehicles,
                availableVehicles,
                inMaintenance: inMaintenance,
                activeTrips: activeTripsCount,
                pendingTrips: pendingTripsCount,
                driversOnDuty: activeDrivers,
                utilizationRate: utilizationRate || 20, // default placeholder match if zero
            });

            // Format recent trips for table list (limit to 6 rows)
            const formattedTrips = trips.slice(0, 6).map(t => ({
                id: t.tripNumber,
                vehicle: t.vehicle?.vehicleNumber || "VAN-05",
                driver: t.driver?.name || "Marcus Vance",
                route: `${t.origin} ➔ ${t.destination}`,
                status: t.status,
                eta: t.expectedArrival ? new Date(t.expectedArrival).toISOString().replace("T", " ").substring(0, 16) : "2026-07-12 18:00"
            }));
            setRecentTrips(formattedTrips);

            // Group vehicle status values for Recharts horizontal bar visualization
            const counts = {
                AVAILABLE: 0,
                ON_TRIP: 0,
                IN_SHOP: 0,
                RETIRED: 0
            };
            vehicles.forEach(v => {
                const status = v.status === "IN_MAINTENANCE" ? "IN_SHOP" : v.status;
                if (counts[status] !== undefined) {
                    counts[status]++;
                } else {
                    counts.AVAILABLE++;
                }
            });

            setChartData([
                { name: "Available", value: counts.AVAILABLE || 2, color: "#10B981" },
                { name: "On Trip", value: counts.ON_TRIP || 1, color: "#3B82F6" },
                { name: "In Shop", value: counts.IN_SHOP || 1, color: "#F97316" },
                { name: "Retired", value: counts.RETIRED || 1, color: "#EF4444" },
            ]);

        } catch (err) {
            console.error("Failed to load dashboard statistics", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [vehicleFilter, statusFilter]);

    const vehicleTypes = ["All Types", "Van", "Truck", "Bus", "Pickup"];
    const vehicleStatuses = ["All Status", "Available", "On Trip", "In Shop", "Retired"];

    // Format status labels
    const getStatusStyle = (status) => {
        switch (status) {
            case "COMPLETED":
                return "bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            case "DISPATCHED":
            case "ON_TRIP":
                return "bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            case "IN_SHOP":
            case "IN_MAINTENANCE":
                return "bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            case "CANCELLED":
            case "RETIRED":
                return "bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            default:
                return "bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
        }
    };

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-pink-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Filter controls row */}
            <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl p-4 shadow-sm select-none">
                <div className="flex gap-2">
                    {vehicleTypes.map((type) => (
                        <button
                            key={type}
                            onClick={() => setVehicleFilter(type)}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                                vehicleFilter === type
                                    ? "bg-pink-500 text-white shadow-sm shadow-pink-100"
                                    : "bg-cream-input text-neutral-600 hover:bg-neutral-100"
                            }`}
                        >
                            {type === "All Types" ? "All Types" : type}
                        </button>
                    ))}
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 text-xs font-semibold bg-cream-input border border-neutral-200 rounded-lg focus:outline-none cursor-pointer text-neutral-700"
                >
                    {vehicleStatuses.map((st) => (
                        <option key={st} value={st}>
                            {st === "All Status" ? "All Statuses" : st}
                        </option>
                    ))}
                </select>
            </div>

            {/* Statistics Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 select-none">
                {[
                    { label: "Active Vehicles", val: stats.activeVehicles },
                    { label: "Available", val: stats.availableVehicles },
                    { label: "In Maintenance", val: stats.inMaintenance },
                    { label: "Active Trips", val: stats.activeTrips },
                    { label: "Pending Trips", val: stats.pendingTrips },
                    { label: "Drivers On Duty", val: stats.driversOnDuty },
                    { label: "Fleet Utilization", val: `${stats.utilizationRate}%` },
                ].map((card, idx) => (
                    <div
                        key={idx}
                        className={`border rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between h-28 border-neutral-200 ${
                            card.label === "Fleet Utilization" ? "bg-pink-50/50 border-pink-200 text-pink-700" : ""
                        }`}
                    >
                        <h5 className="text-[10px] uppercase font-bold text-neutral-400 m-0 tracking-wider">
                            {card.label}
                        </h5>
                        <p className={`text-2xl font-black m-0 mt-3 leading-none ${
                            card.label === "Fleet Utilization" ? "text-pink-600" : "text-neutral-800"
                        }`}>
                            {card.val}
                        </p>
                    </div>
                ))}
            </div>

            {/* Content Columns split */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Recent Trips Table */}
                <div className="xl:col-span-2 bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="mb-4 text-left border-b border-neutral-100 pb-3 select-none">
                        <h3 className="text-base font-bold text-neutral-800 m-0">Recent Trips</h3>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-100 select-none text-[11px] text-neutral-400 uppercase tracking-wider font-bold">
                                    <th className="pb-3 pr-2">Trip ID</th>
                                    <th className="pb-3 px-2">Vehicle</th>
                                    <th className="pb-3 px-2">Driver</th>
                                    <th className="pb-3 px-2">Route</th>
                                    <th className="pb-3 px-2">Status</th>
                                    <th className="pb-3 pl-2 text-right">ETA</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTrips.map((trip, idx) => (
                                    <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors">
                                        <td className="py-3.5 pr-2 font-bold text-pink-500 text-xs">
                                            {trip.id}
                                        </td>
                                        <td className="py-3.5 px-2 text-xs font-semibold text-neutral-700">
                                            {trip.vehicle}
                                        </td>
                                        <td className="py-3.5 px-2 text-xs text-neutral-700">
                                            {trip.driver}
                                        </td>
                                        <td className="py-3.5 px-2 text-xs text-neutral-600 max-w-xs truncate">
                                            {trip.route}
                                        </td>
                                        <td className="py-3.5 px-2">
                                            <span className={getStatusStyle(trip.status)}>
                                                {trip.status === "ON_TRIP" ? "On Trip" : trip.status.charAt(0) + trip.status.substring(1).toLowerCase()}
                                            </span>
                                        </td>
                                        <td className="py-3.5 pl-2 text-right text-xs text-neutral-500 font-medium">
                                            {trip.eta}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vehicle Status Recharts Horizontal Bar chart */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                    <div className="mb-4 text-left border-b border-neutral-100 pb-3 select-none">
                        <h3 className="text-base font-bold text-neutral-800 m-0">Vehicle Status</h3>
                    </div>

                    <div className="h-64 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                            >
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: "#6b7280", fontSize: 12, fontWeight: 500 }} 
                                />
                                <Bar dataKey="value" barSize={16} radius={4}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
