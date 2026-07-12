// ─────────────────────────────────────────────────────────────
// Trips Page — Kanban dispatcher & scheduling controls
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client.js";
import Modal from "../components/Modal.jsx";
import { Search, Plus, Loader2, Play, CheckCircle, Ban, Clock, MapPin, Milestone, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createTripFormSchema = z.object({
    tripNumber: z.string().min(2, "Required").max(50),
    vehicleId: z.string().uuid("Please select a vehicle"),
    driverId: z.string().uuid("Please select a driver"),
    origin: z.string().min(2, "Required").max(255),
    destination: z.string().min(2, "Required").max(255),
    plannedDistance: z.coerce.number().positive("Must be positive"),
    cargoWeight: z.coerce.number().positive("Must be positive"),
    estimatedFuel: z.coerce.number().positive("Must be positive"),
    startOdometer: z.coerce.number().int().nonnegative("Must be positive"),
    dispatchTime: z.string().min(16, "Required"),
    expectedArrival: z.string().min(16, "Required"),
    revenue: z.coerce.number().nonnegative("Must be positive"),
    tripType: z.enum(["OUTBOUND", "INBOUND", "TRANSFER"]),
    notes: z.string().max(500).optional(),
});

const completeTripFormSchema = z.object({
    actualDistance: z.coerce.number().positive("Must be positive"),
    actualFuel: z.coerce.number().positive("Must be positive"),
    endOdometer: z.coerce.number().int().positive("Must be positive"),
    actualArrival: z.string().min(16, "Required"),
});

const Trips = () => {
    const { user, hasPerm } = useAuth();
    const [trips, setTrips] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modals & Active Targets
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCompleteOpen, setIsCompleteOpen] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    const loadTripsAndAssets = async () => {
        try {
            setLoading(true);
            const [tripRes, vehRes, driverRes] = await Promise.all([
                client.get("/trips?limit=100"),
                client.get("/vehicles?limit=100"),
                client.get("/drivers?limit=100"),
            ]);

            setTrips(tripRes.data.data);
            setVehicles(vehRes.data.data);
            setDrivers(driverRes.data.data);
        } catch (err) {
            showToast("Failed to retrieve trips and resources", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTripsAndAssets();
    }, []);

    const {
        register: registerCreate,
        handleSubmit: handleSubmitCreate,
        setValue: setValueCreate,
        watch: watchCreate,
        reset: resetCreate,
        formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate },
    } = useForm({
        resolver: zodResolver(createTripFormSchema),
        defaultValues: {
            tripType: "OUTBOUND",
            dispatchTime: new Date().toISOString().substring(0, 16),
            expectedArrival: new Date(Date.now() + 6 * 3600 * 1000).toISOString().substring(0, 16),
        },
    });

    const selectedVehicleId = watchCreate("vehicleId");
    useEffect(() => {
        if (selectedVehicleId) {
            const v = vehicles.find((v) => v.id === selectedVehicleId);
            if (v) {
                setValueCreate("startOdometer", v.currentOdometer);
            }
        }
    }, [selectedVehicleId, vehicles, setValueCreate]);

    const {
        register: registerComplete,
        handleSubmit: handleSubmitComplete,
        reset: resetComplete,
        formState: { errors: errorsComplete, isSubmitting: isSubmittingComplete },
    } = useForm({
        resolver: zodResolver(completeTripFormSchema),
    });

    const onCreateSubmit = async (data) => {
        try {
            const formatted = {
                ...data,
                dispatchTime: new Date(data.dispatchTime).toISOString(),
                expectedArrival: new Date(data.expectedArrival).toISOString(),
            };
            await client.post("/trips", formatted);
            showToast("Trip scheduled successfully");
            setIsCreateOpen(false);
            resetCreate();
            loadTripsAndAssets();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to schedule trip", "error");
        }
    };

    const handleDispatch = async (tripId) => {
        try {
            await client.patch(`/trips/${tripId}/dispatch`);
            showToast("Trip dispatched successfully — vehicle & driver locked!");
            loadTripsAndAssets();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to dispatch trip", "error");
        }
    };

    const handleCancel = async (tripId) => {
        try {
            await client.patch(`/trips/${tripId}/cancel`);
            showToast("Trip cancelled successfully");
            loadTripsAndAssets();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to cancel trip", "error");
        }
    };

    const openCompleteModal = (trip) => {
        setSelectedTrip(trip);
        resetComplete({
            actualDistance: trip.plannedDistance,
            actualFuel: trip.estimatedFuel,
            endOdometer: trip.startOdometer + Math.round(trip.plannedDistance),
            actualArrival: new Date().toISOString().substring(0, 16),
        });
        setIsCompleteOpen(true);
    };

    const onCompleteSubmit = async (data) => {
        try {
            const formatted = {
                ...data,
                actualArrival: new Date(data.actualArrival).toISOString(),
            };
            await client.patch(`/trips/${selectedTrip.id}/complete`, formatted);
            showToast("Trip completed successfully — asset statuses released!");
            setIsCompleteOpen(false);
            loadTripsAndAssets();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to complete trip", "error");
        }
    };

    // Filters only available vehicles/drivers for create selections
    const availableVehicles = vehicles.filter(v => v.status === "AVAILABLE" && v.availability);
    const availableDrivers = drivers.filter(d => d.status === "AVAILABLE");

    const getStatusStyle = (status) => {
        switch (status) {
            case "COMPLETED":
                return "bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none inline-block";
            case "DISPATCHED":
                return "bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none inline-block";
            case "DRAFT":
            case "SCHEDULED":
                return "bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none inline-block";
            case "CANCELLED":
                return "bg-red-100 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none inline-block";
            default:
                return "bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none inline-block";
        }
    };

    // Filter trips for search query
    const filteredTrips = trips.filter((t) => {
        return (
            t.tripNumber.toLowerCase().includes(search.toLowerCase()) ||
            t.origin.toLowerCase().includes(search.toLowerCase()) ||
            t.destination.toLowerCase().includes(search.toLowerCase()) ||
            t.driver?.name?.toLowerCase().includes(search.toLowerCase()) ||
            t.vehicle?.vehicleNumber?.toLowerCase().includes(search.toLowerCase())
        );
    });

    // Counts for stepper categories
    const counts = {
        DRAFT: trips.filter(t => t.status === "DRAFT" || t.status === "SCHEDULED").length,
        DISPATCHED: trips.filter(t => t.status === "DISPATCHED").length,
        COMPLETED: trips.filter(t => t.status === "COMPLETED").length,
        CANCELLED: trips.filter(t => t.status === "CANCELLED").length,
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Global toast */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-semibold select-none transition-all ${
                    toast.type === "success" 
                        ? "bg-green-50 border-green-200 text-green-700" 
                        : "bg-red-50 border-red-200 text-red-700"
                }`}>
                    {toast.message}
                </div>
            )}

            {/* Stepper Timeline Workflow Header */}
            <div className="grid grid-cols-4 border border-neutral-200 rounded-xl bg-white p-4 shadow-sm select-none">
                {[
                    { step: 1, label: "Draft", count: counts.DRAFT, color: "text-neutral-500 bg-neutral-100" },
                    { step: 2, label: "Dispatched", count: counts.DISPATCHED, color: "text-blue-500 bg-blue-50 border-blue-200" },
                    { step: 3, label: "Completed", count: counts.COMPLETED, color: "text-green-500 bg-green-50 border-green-200" },
                    { step: 4, label: "Cancelled", count: counts.CANCELLED, color: "text-red-500 bg-red-50 border-red-200" },
                ].map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center justify-center gap-2 relative">
                        {idx < 3 && <div className="hidden md:block absolute right-[-50%] top-4 w-full h-[1px] bg-neutral-200 z-0"></div>}
                        <div className="z-10 flex items-center justify-center gap-3">
                            <div className="h-8 w-8 rounded-full border border-neutral-200 bg-white flex items-center justify-center font-bold text-xs">
                                {item.step}
                            </div>
                            <div className="text-left">
                                <h5 className="text-[10px] uppercase font-bold text-neutral-400 m-0 tracking-wider">
                                    {item.label}
                                </h5>
                                <p className="text-sm font-black text-neutral-800 m-0 leading-none mt-1">
                                    {item.count}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Action control bar */}
            <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl p-4 shadow-sm select-none">
                <div className="relative w-80">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Search className="h-4 w-4" />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search trips..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 placeholder-neutral-400"
                    />
                </div>

                {hasPerm("trip", "create") && (
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-accent-pink hover:bg-accent-pink-hover text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-pink-100"
                    >
                        <Plus className="h-4 w-4" />
                        Create Trip
                    </button>
                )}
            </div>

            {/* Trips Grid Board */}
            {loading ? (
                <div className="py-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                </div>
            ) : filteredTrips.length === 0 ? (
                <div className="bg-white border border-neutral-200 rounded-xl py-12 text-center text-neutral-400 font-medium">
                    No trips found.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 text-left">
                    {filteredTrips.map((trip, idx) => (
                        <div key={idx} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-neutral-300 transition-colors">
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4 select-none">
                                <span className="font-bold text-pink-500 text-xs tracking-wide">
                                    {trip.tripNumber}
                                </span>
                                <span className={getStatusStyle(trip.status)}>
                                    {trip.status === "DISPATCHED" ? "Dispatched" : trip.status.charAt(0) + trip.status.substring(1).toLowerCase()}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="flex flex-col gap-3 mb-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                                    <MapPin className="h-4 w-4 text-neutral-400 stroke-[2.5px]" />
                                    <span>{trip.origin}</span>
                                    <span className="text-neutral-400 font-normal mx-0.5">➔</span>
                                    <span>{trip.destination}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-2 text-xs text-neutral-500 font-medium mt-1">
                                    <div>Vehicle: <span className="text-neutral-800 font-semibold">{trip.vehicle?.vehicleNumber || "N/A"}</span></div>
                                    <div>Driver: <span className="text-neutral-800 font-semibold">{trip.driver?.name || "N/A"}</span></div>
                                    <div>Cargo: <span className="text-neutral-800 font-semibold">{trip.cargoWeight?.toLocaleString()}kg · {trip.plannedDistance?.toLocaleString()}km</span></div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-neutral-400" />
                                        <span>ETA: {trip.expectedArrival ? trip.expectedArrival.substring(0, 10) + " " + trip.expectedArrival.substring(11, 16) : ""}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Actions Footer */}
                            {hasPerm("trip", "dispatch") && (trip.status === "DRAFT" || trip.status === "SCHEDULED") && (
                                <button
                                    onClick={() => handleDispatch(trip.id)}
                                    className="w-full mt-2 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-blue-100 transition-colors"
                                >
                                    <Play className="h-3.5 w-3.5 fill-current" />
                                    Dispatch Now
                                </button>
                            )}

                            {hasPerm("trip", "update") && trip.status === "DISPATCHED" && (
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <button
                                        onClick={() => openCompleteModal(trip)}
                                        className="py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-green-100 transition-colors"
                                    >
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        Complete
                                    </button>
                                    <button
                                        onClick={() => handleCancel(trip.id)}
                                        className="py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-pink-100 transition-colors"
                                    >
                                        <Ban className="h-3.5 w-3.5" />
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Create Trip */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Schedule Delivery Trip">
                <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Trip Number</label>
                            <input {...registerCreate("tripNumber")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="e.g. TR-1092" />
                            {errorsCreate.tripNumber && <span className="text-[10px] text-red-500">{errorsCreate.tripNumber.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Trip Type</label>
                            <select {...registerCreate("tripType")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm">
                                <option value="OUTBOUND">Outbound</option>
                                <option value="INBOUND">Inbound</option>
                                <option value="TRANSFER">Transfer</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Select Available Vehicle</label>
                            <select {...registerCreate("vehicleId")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600">
                                <option value="">-- Choose Vehicle --</option>
                                {availableVehicles.map((v) => (
                                    <option key={v.id} value={v.id}>{v.vehicleNumber} ({v.name} - Odo: {v.currentOdometer})</option>
                                ))}
                            </select>
                            {errorsCreate.vehicleId && <span className="text-[10px] text-red-500">{errorsCreate.vehicleId.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Select Available Driver</label>
                            <select {...registerCreate("driverId")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600">
                                <option value="">-- Choose Driver --</option>
                                {availableDrivers.map((d) => (
                                    <option key={d.id} value={d.id}>{d.name} ({formatLicenseCategory(d.licenseCategory)})</option>
                                ))}
                            </select>
                            {errorsCreate.driverId && <span className="text-[10px] text-red-500">{errorsCreate.driverId.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Origin Address</label>
                            <input {...registerCreate("origin")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="Depot A" />
                            {errorsCreate.origin && <span className="text-[10px] text-red-500">{errorsCreate.origin.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Destination Address</label>
                            <input {...registerCreate("destination")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="Warehouse B" />
                            {errorsCreate.destination && <span className="text-[10px] text-red-500">{errorsCreate.destination.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Distance (km)</label>
                            <input type="number" {...registerCreate("plannedDistance")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsCreate.plannedDistance && <span className="text-[10px] text-red-500">{errorsCreate.plannedDistance.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Est. Fuel (L)</label>
                            <input type="number" {...registerCreate("estimatedFuel")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsCreate.estimatedFuel && <span className="text-[10px] text-red-500">{errorsCreate.estimatedFuel.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Cargo Wt (kg)</label>
                            <input type="number" {...registerCreate("cargoWeight")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsCreate.cargoWeight && <span className="text-[10px] text-red-500">{errorsCreate.cargoWeight.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Start Odo (km)</label>
                            <input type="number" readonly {...registerCreate("startOdometer")} className="px-3 py-2 bg-neutral-100 border border-neutral-200 rounded-lg text-sm select-none" />
                        </div>
                        <div className="flex flex-col gap-1 col-span-2">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Scheduled Revenue (INR)</label>
                            <input type="number" {...registerCreate("revenue")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsCreate.revenue && <span className="text-[10px] text-red-500">{errorsCreate.revenue.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Dispatch Time</label>
                            <input type="datetime-local" {...registerCreate("dispatchTime")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600" />
                            {errorsCreate.dispatchTime && <span className="text-[10px] text-red-500">{errorsCreate.dispatchTime.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Expected Arrival</label>
                            <input type="datetime-local" {...registerCreate("expectedArrival")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600" />
                            {errorsCreate.expectedArrival && <span className="text-[10px] text-red-500">{errorsCreate.expectedArrival.message}</span>}
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmittingCreate} className="mt-4 py-2.5 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingCreate ? "Submitting..." : "Schedule Outbound Trip"}
                    </button>
                </form>
            </Modal>

            {/* Modal: Complete Trip */}
            <Modal isOpen={isCompleteOpen} onClose={() => setIsCompleteOpen(false)} title="Record Trip Completion details">
                <form onSubmit={handleSubmitComplete(onCompleteSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Actual Distance (km)</label>
                            <input type="number" {...registerComplete("actualDistance")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsComplete.actualDistance && <span className="text-[10px] text-red-500">{errorsComplete.actualDistance.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Actual Fuel used (L)</label>
                            <input type="number" {...registerComplete("actualFuel")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsComplete.actualFuel && <span className="text-[10px] text-red-500">{errorsComplete.actualFuel.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Final Odometer reading (km)</label>
                            <input type="number" {...registerComplete("endOdometer")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsComplete.endOdometer && <span className="text-[10px] text-red-500">{errorsComplete.endOdometer.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Actual Arrival Time</label>
                            <input type="datetime-local" {...registerComplete("actualArrival")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600" />
                            {errorsComplete.actualArrival && <span className="text-[10px] text-red-500">{errorsComplete.actualArrival.message}</span>}
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmittingComplete} className="mt-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingComplete ? "Completing..." : "Complete & Release Assets"}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

const formatLicenseCategory = (cat) => {
    return cat ? cat.replace("CLASS_", "Class ") : "";
};

export default Trips;
