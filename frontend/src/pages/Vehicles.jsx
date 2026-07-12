// ─────────────────────────────────────────────────────────────
// Vehicle Registry Page — Fleet Management CRUD
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client.js";
import Modal from "../components/Modal.jsx";
import { Search, Plus, Edit2, Loader2, ChevronLeft, ChevronRight, Info } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const vehicleFormSchema = z.object({
    registrationNumber: z.string().min(2, "Required").max(50),
    vehicleNumber: z.string().min(2, "Required").max(50),
    name: z.string().min(2, "Required").max(100),
    manufacturer: z.string().min(2, "Required").max(100),
    model: z.string().min(1, "Required").max(100),
    manufacturingYear: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
    fuelType: z.enum(["DIESEL", "PETROL", "ELECTRIC", "HYBRID"]),
    payloadCapacity: z.coerce.number().positive("Must be positive"),
    purchaseCost: z.coerce.number().positive("Must be positive"),
    purchaseDate: z.string().min(10, "Required"),
    currentOdometer: z.coerce.number().int().nonnegative("Must be positive"),
    status: z.enum(["AVAILABLE", "ON_TRIP", "IN_MAINTENANCE", "RETIRED"]).optional(),
});

const Vehicles = () => {
    const { user, hasPerm } = useAuth();
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All Types");
    const [statusFilter, setStatusFilter] = useState("All Status");
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 5;

    // Toast state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    // Modals
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [activeVehicle, setActiveVehicle] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    const loadVehicles = async () => {
        try {
            setLoading(true);
            const res = await client.get(`/vehicles?page=${page}&limit=${limit}`);
            const { data, meta } = res.data;
            setVehicles(data);
            setTotalPages(meta?.pagination?.totalPages || 1);
            setTotalItems(meta?.pagination?.totalItems || 0);
        } catch (err) {
            showToast("Failed to fetch vehicles list", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadVehicles();
    }, [page]);

    const {
        register: registerAdd,
        handleSubmit: handleSubmitAdd,
        reset: resetAdd,
        formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
    } = useForm({
        resolver: zodResolver(vehicleFormSchema),
        defaultValues: {
            fuelType: "DIESEL",
            currentOdometer: 0,
            purchaseDate: new Date().toISOString().substring(0, 10),
        },
    });

    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
    } = useForm({
        resolver: zodResolver(vehicleFormSchema),
    });

    const onAddSubmit = async (data) => {
        try {
            const formatted = {
                ...data,
                purchaseDate: new Date(data.purchaseDate).toISOString(),
            };
            await client.post("/vehicles", formatted);
            showToast("Vehicle created successfully");
            setIsAddOpen(false);
            resetAdd();
            loadVehicles();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to create vehicle", "error");
        }
    };

    const onEditSubmit = async (data) => {
        try {
            const formatted = {
                ...data,
                purchaseDate: new Date(data.purchaseDate).toISOString(),
            };
            await client.put(`/vehicles/${activeVehicle.id}`, formatted);
            showToast("Vehicle updated successfully");
            setIsEditOpen(false);
            loadVehicles();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update vehicle", "error");
        }
    };

    const openEditModal = (vehicle) => {
        setActiveVehicle(vehicle);
        resetEdit({
            registrationNumber: vehicle.registrationNumber,
            vehicleNumber: vehicle.vehicleNumber,
            name: vehicle.name,
            manufacturer: vehicle.manufacturer,
            model: vehicle.model,
            manufacturingYear: vehicle.manufacturingYear,
            fuelType: vehicle.fuelType,
            payloadCapacity: vehicle.payloadCapacity,
            purchaseCost: vehicle.purchaseCost,
            purchaseDate: vehicle.purchaseDate ? vehicle.purchaseDate.substring(0, 10) : "",
            currentOdometer: vehicle.currentOdometer,
            status: vehicle.status,
        });
        setIsEditOpen(true);
    };

    // Filter logic on front-end for immediate results
    const filteredVehicles = vehicles.filter((v) => {
        const matchesSearch =
            v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
            v.name.toLowerCase().includes(search.toLowerCase()) ||
            v.model.toLowerCase().includes(search.toLowerCase()) ||
            v.vehicleNumber.toLowerCase().includes(search.toLowerCase());

        const matchesType =
            typeFilter === "All Types" ||
            v.fuelType === typeFilter.toUpperCase() ||
            v.name.toLowerCase().includes(typeFilter.toLowerCase());

        const matchesStatus =
            statusFilter === "All Status" ||
            (statusFilter === "In Shop" && v.status === "IN_MAINTENANCE") ||
            v.status === statusFilter.toUpperCase().replace(" ", "_");

        return matchesSearch && matchesType && matchesStatus;
    });

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case "AVAILABLE":
                return "bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            case "ON_TRIP":
                return "bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            case "IN_MAINTENANCE":
                return "bg-orange-100 text-orange-700 border border-orange-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            case "RETIRED":
                return "bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            default:
                return "bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
        }
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Global toast component */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-semibold select-none transition-all ${
                    toast.type === "success" 
                        ? "bg-green-50 border-green-200 text-green-700" 
                        : "bg-red-50 border-red-200 text-red-700"
                }`}>
                    {toast.message}
                </div>
            )}

            {/* Filter controls bar */}
            <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl p-4 shadow-sm select-none">
                <div className="relative w-80">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Search className="h-4 w-4" />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search vehicles..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 placeholder-neutral-400"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-4 py-2 text-xs font-semibold bg-cream-input border border-neutral-200 rounded-lg focus:outline-none cursor-pointer text-neutral-700"
                    >
                        {["All Types", "Van", "Truck", "Bus", "Pickup"].map((t) => (
                            <option key={t} value={t}>{t === "All Types" ? "All Types" : t}</option>
                        ))}
                    </select>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 text-xs font-semibold bg-cream-input border border-neutral-200 rounded-lg focus:outline-none cursor-pointer text-neutral-700"
                    >
                        {["All Status", "Available", "On Trip", "In Shop", "Retired"].map((s) => (
                            <option key={s} value={s}>{s === "All Status" ? "All Statuses" : s}</option>
                        ))}
                    </select>

                    {hasPerm("vehicle", "create") && (
                        <button
                            onClick={() => setIsAddOpen(true)}
                            className="bg-accent-pink hover:bg-accent-pink-hover text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-pink-100"
                        >
                            <Plus className="h-4 w-4" />
                            Add Vehicle
                        </button>
                    )}
                </div>
            </div>

            {/* Vehicles Table Card */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-100 select-none text-[11px] text-neutral-400 uppercase tracking-wider font-bold">
                                <th className="pb-3 pr-2">Reg. No.</th>
                                <th className="pb-3 px-2">Name/Model</th>
                                <th className="pb-3 px-2">Type</th>
                                <th className="pb-3 px-2">Capacity</th>
                                <th className="pb-3 px-2">Odometer</th>
                                <th className="pb-3 px-2">Acq. Cost</th>
                                <th className="pb-3 px-2">Status</th>
                                {hasPerm("vehicle", "update") && <th className="pb-3 pl-2 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="py-8 text-center text-neutral-400">
                                        <Loader2 className="h-6 w-6 animate-spin text-pink-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredVehicles.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="py-8 text-center text-neutral-400 font-medium">
                                        No vehicles found.
                                    </td>
                                </tr>
                            ) : (
                                filteredVehicles.map((vehicle, idx) => (
                                    <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors">
                                        <td className="py-4 pr-2 font-bold text-pink-500 text-xs">
                                            {vehicle.registrationNumber}
                                        </td>
                                        <td className="py-4 px-2 text-xs font-semibold text-neutral-700">
                                            {vehicle.name}
                                        </td>
                                        <td className="py-4 px-2 text-xs text-neutral-500 capitalize">
                                            {vehicle.fuelType?.toLowerCase()}
                                        </td>
                                        <td className="py-4 px-2 text-xs text-neutral-600">
                                            {vehicle.payloadCapacity?.toLocaleString()} kg
                                        </td>
                                        <td className="py-4 px-2 text-xs text-neutral-600 font-mono">
                                            {vehicle.currentOdometer?.toLocaleString()} km
                                        </td>
                                        <td className="py-4 px-2 text-xs text-neutral-600 font-mono">
                                            ₹{vehicle.purchaseCost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className={getStatusBadgeClass(vehicle.status)}>
                                                {vehicle.status === "IN_MAINTENANCE" ? "In Shop" : vehicle.status.charAt(0) + vehicle.status.substring(1).toLowerCase().replace("_", " ")}
                                            </span>
                                        </td>
                                        {hasPerm("vehicle", "update") && (
                                            <td className="py-4 pl-2 text-right">
                                                <button
                                                    onClick={() => openEditModal(vehicle)}
                                                    className="p-1.5 text-neutral-400 hover:text-pink-500 transition-colors cursor-pointer border-none bg-transparent"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Bottom Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-4 select-none">
                        <span className="text-xs text-neutral-400 font-semibold">
                            Showing page {page} of {totalPages} ({totalItems} items)
                        </span>
                        <div className="flex gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-300 text-neutral-600 transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                disabled={page === totalPages}
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 disabled:bg-neutral-100 disabled:text-neutral-300 text-neutral-600 transition-colors cursor-pointer"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Alert Warning Info */}
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold text-left select-none">
                <Info className="h-5 w-5 stroke-[2.5px] text-rose-500 shrink-0" />
                Registration No. must be unique — Retired/In Shop vehicles are hidden from Trip Dispatcher.
            </div>

            {/* Modal: Create Vehicle */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Add New Vehicle">
                <form onSubmit={handleSubmitAdd(onAddSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Reg. Number</label>
                            <input {...registerAdd("registrationNumber")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="e.g. TRK-4932" />
                            {errorsAdd.registrationNumber && <span className="text-[10px] text-red-500">{errorsAdd.registrationNumber.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Vehicle ID No.</label>
                            <input {...registerAdd("vehicleNumber")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="e.g. V-01" />
                            {errorsAdd.vehicleNumber && <span className="text-[10px] text-red-500">{errorsAdd.vehicleNumber.message}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Model Name</label>
                        <input {...registerAdd("name")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="Volvo FH16" />
                        {errorsAdd.name && <span className="text-[10px] text-red-500">{errorsAdd.name.message}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Manufacturer</label>
                            <input {...registerAdd("manufacturer")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="Volvo" />
                            {errorsAdd.manufacturer && <span className="text-[10px] text-red-500">{errorsAdd.manufacturer.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Model Variant</label>
                            <input {...registerAdd("model")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="Semi-Truck" />
                            {errorsAdd.model && <span className="text-[10px] text-red-500">{errorsAdd.model.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Mfg. Year</label>
                            <input type="number" {...registerAdd("manufacturingYear")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsAdd.manufacturingYear && <span className="text-[10px] text-red-500">{errorsAdd.manufacturingYear.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Fuel Type</label>
                            <select {...registerAdd("fuelType")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm">
                                <option value="DIESEL">Diesel</option>
                                <option value="PETROL">Petrol</option>
                                <option value="ELECTRIC">Electric</option>
                                <option value="HYBRID">Hybrid</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Capacity (kg)</label>
                            <input type="number" {...registerAdd("payloadCapacity")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsAdd.payloadCapacity && <span className="text-[10px] text-red-500">{errorsAdd.payloadCapacity.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Odometer (km)</label>
                            <input type="number" {...registerAdd("currentOdometer")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsAdd.currentOdometer && <span className="text-[10px] text-red-500">{errorsAdd.currentOdometer.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Acq. Cost</label>
                            <input type="number" {...registerAdd("purchaseCost")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsAdd.purchaseCost && <span className="text-[10px] text-red-500">{errorsAdd.purchaseCost.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Acq. Date</label>
                            <input type="date" {...registerAdd("purchaseDate")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm text-neutral-600" />
                            {errorsAdd.purchaseDate && <span className="text-[10px] text-red-500">{errorsAdd.purchaseDate.message}</span>}
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmittingAdd} className="mt-4 py-2.5 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingAdd ? "Submitting..." : "Save Vehicle"}
                    </button>
                </form>
            </Modal>

            {/* Modal: Edit Vehicle */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Vehicle Details">
                <form onSubmit={handleSubmitEdit(onEditSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Reg. Number</label>
                            <input {...registerEdit("registrationNumber")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.registrationNumber && <span className="text-[10px] text-red-500">{errorsEdit.registrationNumber.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Vehicle ID No.</label>
                            <input {...registerEdit("vehicleNumber")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.vehicleNumber && <span className="text-[10px] text-red-500">{errorsEdit.vehicleNumber.message}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Model Name</label>
                        <input {...registerEdit("name")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                        {errorsEdit.name && <span className="text-[10px] text-red-500">{errorsEdit.name.message}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Manufacturer</label>
                            <input {...registerEdit("manufacturer")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.manufacturer && <span className="text-[10px] text-red-500">{errorsEdit.manufacturer.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Model Variant</label>
                            <input {...registerEdit("model")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.model && <span className="text-[10px] text-red-500">{errorsEdit.model.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Mfg. Year</label>
                            <input type="number" {...registerEdit("manufacturingYear")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.manufacturingYear && <span className="text-[10px] text-red-500">{errorsEdit.manufacturingYear.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Fuel Type</label>
                            <select {...registerEdit("fuelType")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm">
                                <option value="DIESEL">Diesel</option>
                                <option value="PETROL">Petrol</option>
                                <option value="ELECTRIC">Electric</option>
                                <option value="HYBRID">Hybrid</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Capacity (kg)</label>
                            <input type="number" {...registerEdit("payloadCapacity")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.payloadCapacity && <span className="text-[10px] text-red-500">{errorsEdit.payloadCapacity.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Odometer (km)</label>
                            <input type="number" {...registerEdit("currentOdometer")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.currentOdometer && <span className="text-[10px] text-red-500">{errorsEdit.currentOdometer.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Acq. Cost</label>
                            <input type="number" {...registerEdit("purchaseCost")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.purchaseCost && <span className="text-[10px] text-red-500">{errorsEdit.purchaseCost.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Acq. Date</label>
                            <input type="date" {...registerEdit("purchaseDate")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm text-neutral-600" />
                            {errorsEdit.purchaseDate && <span className="text-[10px] text-red-500">{errorsEdit.purchaseDate.message}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Operational Status</label>
                        <select {...registerEdit("status")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm">
                            <option value="AVAILABLE">Available</option>
                            <option value="ON_TRIP">On Trip</option>
                            <option value="IN_MAINTENANCE">In Shop</option>
                            <option value="RETIRED">Retired</option>
                        </select>
                    </div>
                    <button type="submit" disabled={isSubmittingEdit} className="mt-4 py-2.5 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingEdit ? "Updating..." : "Update Vehicle"}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Vehicles;
