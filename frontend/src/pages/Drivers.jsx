// ─────────────────────────────────────────────────────────────
// Drivers Page — Profiles & Safety Operations CRUD
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client.js";
import Modal from "../components/Modal.jsx";
import { Search, Plus, Edit2, Loader2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const driverFormSchema = z.object({
    employeeCode: z.string().min(2, "Required").max(50),
    name: z.string().min(2, "Required").max(100),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(5, "Required").max(30),
    licenseNumber: z.string().min(3, "Required").max(50),
    licenseCategory: z.enum(["CLASS_A", "CLASS_B", "CLASS_C", "CLASS_D", "COMMERCIAL", "HEAVY_VEHICLE"]),
    licenseExpiry: z.string().min(10, "Required"),
    dateOfBirth: z.string().min(10, "Required"),
    joiningDate: z.string().min(10, "Required"),
    experience: z.coerce.number().int().nonnegative("Must be 0 or more"),
    salary: z.coerce.number().positive("Must be positive"),
    status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).optional(),
    safetyScore: z.coerce.number().min(0).max(100).optional(),
    tripCompletionRate: z.coerce.number().min(0).max(100).optional(),
});

const Drivers = () => {
    const { user, hasPerm } = useAuth();
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
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
    const [activeDriver, setActiveDriver] = useState(null);

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    const loadDrivers = async () => {
        try {
            setLoading(true);
            const res = await client.get(`/drivers?page=${page}&limit=${limit}`);
            const { data, meta } = res.data;
            setDrivers(data);
            setTotalPages(meta?.pagination?.totalPages || 1);
            setTotalItems(meta?.pagination?.totalItems || 0);
        } catch (err) {
            showToast("Failed to retrieve driver list", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDrivers();
    }, [page]);

    // Quick status toggle via direct link click
    const toggleStatus = async (driverId, newStatus) => {
        try {
            await client.put(`/drivers/${driverId}`, { status: newStatus });
            showToast(`Driver status mutated to ${newStatus}`);
            loadDrivers();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update driver status", "error");
        }
    };

    const {
        register: registerAdd,
        handleSubmit: handleSubmitAdd,
        reset: resetAdd,
        formState: { errors: errorsAdd, isSubmitting: isSubmittingAdd },
    } = useForm({
        resolver: zodResolver(driverFormSchema),
        defaultValues: {
            employeeCode: `EMP-${Date.now().toString().slice(-5)}`,
            licenseCategory: "CLASS_A",
            dateOfBirth: "1990-01-01",
            joiningDate: new Date().toISOString().substring(0, 10),
            licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10),
            experience: 2,
            salary: 4500,
            safetyScore: 95,
            tripCompletionRate: 98,
        },
    });

    const {
        register: registerEdit,
        handleSubmit: handleSubmitEdit,
        reset: resetEdit,
        formState: { errors: errorsEdit, isSubmitting: isSubmittingEdit },
    } = useForm({
        resolver: zodResolver(driverFormSchema),
    });

    const onAddSubmit = async (data) => {
        try {
            const formatted = {
                ...data,
                licenseExpiry: new Date(data.licenseExpiry).toISOString(),
                dateOfBirth: new Date(data.dateOfBirth).toISOString(),
                joiningDate: new Date(data.joiningDate).toISOString(),
            };
            await client.post("/drivers", formatted);
            showToast("Driver registered successfully");
            setIsAddOpen(false);
            resetAdd();
            loadDrivers();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to register driver", "error");
        }
    };

    const onEditSubmit = async (data) => {
        try {
            const formatted = {
                ...data,
                licenseExpiry: new Date(data.licenseExpiry).toISOString(),
                dateOfBirth: new Date(data.dateOfBirth).toISOString(),
                joiningDate: data.joiningDate ? new Date(data.joiningDate).toISOString() : undefined,
            };
            await client.put(`/drivers/${activeDriver.id}`, formatted);
            showToast("Driver profile updated successfully");
            setIsEditOpen(false);
            loadDrivers();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to update driver details", "error");
        }
    };

    const openEditModal = (driver) => {
        setActiveDriver(driver);
        resetEdit({
            employeeCode: driver.employeeCode || "",
            name: driver.name,
            email: driver.email,
            phone: driver.phone,
            licenseNumber: driver.licenseNumber || "",
            licenseCategory: driver.licenseCategory,
            licenseExpiry: driver.licenseExpiry ? driver.licenseExpiry.substring(0, 10) : "",
            dateOfBirth: driver.dateOfBirth ? driver.dateOfBirth.substring(0, 10) : "",
            joiningDate: driver.joiningDate ? driver.joiningDate.substring(0, 10) : new Date().toISOString().substring(0, 10),
            experience: driver.experience || 0,
            salary: driver.salary || 4000,
            status: driver.status,
            safetyScore: driver.safetyScore || 90,
            tripCompletionRate: driver.tripCompletionRate || 95,
        });
        setIsEditOpen(true);
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case "AVAILABLE":
                return "bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            case "ON_TRIP":
                return "bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            case "OFF_DUTY":
                return "bg-neutral-100 text-neutral-600 border border-neutral-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            case "SUSPENDED":
                return "bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-md text-xs font-semibold select-none inline-block";
            default:
                return "bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-md text-xs font-semibold inline-block";
        }
    };

    const isLicenseExpired = (expiryStr) => {
        if (!expiryStr) return false;
        return new Date(expiryStr) < new Date();
    };

    const formatLicenseCategory = (cat) => {
        return cat ? cat.replace("CLASS_", "Class ") : "";
    };

    const formatExpiryDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    // Frontend search filter
    const filteredDrivers = drivers.filter((d) => {
        return (
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            d.licenseNumber?.toLowerCase().includes(search.toLowerCase()) ||
            d.email.toLowerCase().includes(search.toLowerCase()) ||
            d.phone.toLowerCase().includes(search.toLowerCase())
        );
    });

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

            {/* Subtitle warning info alert */}
            <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-800 text-xs font-semibold text-left select-none">
                <AlertTriangle className="h-5 w-5 stroke-[2.5px] text-orange-500 shrink-0" />
                Expired license or Suspended status — locked from trip assignment.
            </div>

            {/* Filter controls row */}
            <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl p-4 shadow-sm select-none">
                <div className="relative w-80">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Search className="h-4 w-4" />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search drivers..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 placeholder-neutral-400"
                    />
                </div>

                {hasPerm("driver", "create") && (
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="bg-accent-pink hover:bg-accent-pink-hover text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-pink-100"
                    >
                        <Plus className="h-4 w-4" />
                        Add Driver
                    </button>
                )}
            </div>

            {/* Drivers Registry Table */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-100 select-none text-[11px] text-neutral-400 uppercase tracking-wider font-bold">
                                <th className="pb-3 pr-2">Driver</th>
                                <th className="pb-3 px-2">License No.</th>
                                <th className="pb-3 px-2">Category</th>
                                <th className="pb-3 px-2">Expiry</th>
                                <th className="pb-3 px-2">Contact</th>
                                <th className="pb-3 px-2">Trip Compl.</th>
                                <th className="pb-3 px-2 w-40">Safety Score</th>
                                <th className="pb-3 px-2">Status</th>
                                {hasPerm("driver", "update") && <th className="pb-3 pl-2 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-neutral-400">
                                        <Loader2 className="h-6 w-6 animate-spin text-pink-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredDrivers.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="py-8 text-center text-neutral-400 font-medium">
                                        No drivers found.
                                    </td>
                                </tr>
                            ) : (
                                filteredDrivers.map((driver, idx) => {
                                    const expired = isLicenseExpired(driver.licenseExpiry);
                                    return (
                                        <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors">
                                            <td className="py-4 pr-2 font-bold text-neutral-800 text-xs flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-[10px]">
                                                    {driver.name.split(" ").map(w => w[0]).join("").substring(0, 2).toUpperCase()}
                                                </div>
                                                {driver.name}
                                            </td>
                                            <td className="py-4 px-2 text-xs font-semibold text-neutral-700 font-mono">
                                                {driver.licenseNumber || "N/A"}
                                            </td>
                                            <td className="py-4 px-2 text-xs text-neutral-500">
                                                {formatLicenseCategory(driver.licenseCategory)}
                                            </td>
                                            <td className={`py-4 px-2 text-xs font-semibold ${expired ? "text-red-500 font-bold" : "text-neutral-600"}`}>
                                                {formatExpiryDate(driver.licenseExpiry)}
                                                {expired && <span className="ml-1 text-[10px] text-red-500">▲</span>}
                                            </td>
                                            <td className="py-4 px-2 text-xs text-neutral-600">
                                                {driver.phone}
                                            </td>
                                            <td className="py-4 px-2 text-xs text-neutral-600 font-semibold font-mono">
                                                {driver.tripCompletionRate || 95}%
                                            </td>
                                            <td className="py-4 px-2 select-none">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 bg-neutral-100 rounded-full h-1.5 overflow-hidden">
                                                        <div className="bg-pink-500 h-full rounded-full" style={{ width: `${driver.safetyScore || 90}%` }}></div>
                                                    </div>
                                                    <span className="text-xs font-bold text-neutral-700 font-mono">{driver.safetyScore || 90}%</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-2">
                                                <span className={getStatusBadge(driver.status)}>
                                                    {driver.status === "ON_TRIP" ? "On Trip" : driver.status?.charAt(0) + driver.status?.substring(1).toLowerCase().replace("_", " ")}
                                                </span>
                                            </td>
                                            {hasPerm("driver", "update") && (
                                                <td className="py-4 pl-2 text-right">
                                                    <div className="flex items-center justify-end gap-1.5 text-[11px] font-bold text-neutral-400 select-none">
                                                        {["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]
                                                            .filter(st => st !== driver.status)
                                                            .map((st) => (
                                                                <button
                                                                    key={st}
                                                                    onClick={() => toggleStatus(driver.id, st)}
                                                                    className={`px-1.5 py-0.5 rounded cursor-pointer hover:bg-neutral-100 ${
                                                                        st === "SUSPENDED" ? "hover:text-red-500" : "hover:text-pink-500"
                                                                    }`}
                                                                >
                                                                    {st === "ON_TRIP" ? "On Trip" : st.charAt(0) + st.substring(1).toLowerCase().replace("_", " ")}
                                                                </button>
                                                            ))}
                                                        <span className="text-neutral-300 px-0.5">|</span>
                                                        <button
                                                            onClick={() => openEditModal(driver)}
                                                            className="text-neutral-500 hover:text-neutral-800 font-bold transition-colors cursor-pointer border-none bg-transparent"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })
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

            {/* Modal: Create Driver */}
            <Modal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} title="Register Certified Driver">
                <form onSubmit={handleSubmitAdd(onAddSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Employee Code</label>
                            <input {...registerAdd("employeeCode")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="e.g. EMP-001" />
                            {errorsAdd.employeeCode && <span className="text-[10px] text-red-500">{errorsAdd.employeeCode.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Driver Name</label>
                            <input {...registerAdd("name")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="e.g. Alex Johnson" />
                            {errorsAdd.name && <span className="text-[10px] text-red-500">{errorsAdd.name.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Email Address</label>
                            <input type="email" {...registerAdd("email")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="alex@transitops.com" />
                            {errorsAdd.email && <span className="text-[10px] text-red-500">{errorsAdd.email.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Phone Contact</label>
                            <input {...registerAdd("phone")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="+1-555-0101" />
                            {errorsAdd.phone && <span className="text-[10px] text-red-500">{errorsAdd.phone.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Date of Birth</label>
                            <input type="date" {...registerAdd("dateOfBirth")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm text-neutral-600" />
                            {errorsAdd.dateOfBirth && <span className="text-[10px] text-red-500">{errorsAdd.dateOfBirth.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Joining Date</label>
                            <input type="date" {...registerAdd("joiningDate")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm text-neutral-600" />
                            {errorsAdd.joiningDate && <span className="text-[10px] text-red-500">{errorsAdd.joiningDate.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Experience (Yrs)</label>
                            <input type="number" min="0" {...registerAdd("experience")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsAdd.experience && <span className="text-[10px] text-red-500">{errorsAdd.experience.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">License No.</label>
                            <input {...registerAdd("licenseNumber")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="DL-AJ-001" />
                            {errorsAdd.licenseNumber && <span className="text-[10px] text-red-500">{errorsAdd.licenseNumber.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">License Cat.</label>
                            <select {...registerAdd("licenseCategory")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm">
                                <option value="CLASS_A">Class A</option>
                                <option value="CLASS_B">Class B</option>
                                <option value="CLASS_C">Class C</option>
                                <option value="CLASS_D">Class D</option>
                                <option value="COMMERCIAL">Commercial</option>
                                <option value="HEAVY_VEHICLE">Heavy Vehicle</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">License Expiry</label>
                            <input type="date" {...registerAdd("licenseExpiry")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm text-neutral-600" />
                            {errorsAdd.licenseExpiry && <span className="text-[10px] text-red-500">{errorsAdd.licenseExpiry.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Salary (INR/mo)</label>
                            <input type="number" {...registerAdd("salary")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsAdd.salary && <span className="text-[10px] text-red-500">{errorsAdd.salary.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Safety Score (%)</label>
                            <input type="number" {...registerAdd("safetyScore")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Completion Rate (%)</label>
                            <input type="number" {...registerAdd("tripCompletionRate")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmittingAdd} className="mt-4 py-2.5 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingAdd ? "Submitting..." : "Save Profile"}
                    </button>
                </form>
            </Modal>

            {/* Modal: Edit Driver */}
            <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Driver Profile">
                <form onSubmit={handleSubmitEdit(onEditSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Employee Code</label>
                            <input {...registerEdit("employeeCode")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.employeeCode && <span className="text-[10px] text-red-500">{errorsEdit.employeeCode.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Driver Name</label>
                            <input {...registerEdit("name")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.name && <span className="text-[10px] text-red-500">{errorsEdit.name.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Email Address</label>
                            <input type="email" {...registerEdit("email")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.email && <span className="text-[10px] text-red-500">{errorsEdit.email.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Phone Contact</label>
                            <input {...registerEdit("phone")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.phone && <span className="text-[10px] text-red-500">{errorsEdit.phone.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Date of Birth</label>
                            <input type="date" {...registerEdit("dateOfBirth")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm text-neutral-600" />
                            {errorsEdit.dateOfBirth && <span className="text-[10px] text-red-500">{errorsEdit.dateOfBirth.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Joining Date</label>
                            <input type="date" {...registerEdit("joiningDate")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm text-neutral-600" />
                            {errorsEdit.joiningDate && <span className="text-[10px] text-red-500">{errorsEdit.joiningDate.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Experience (Yrs)</label>
                            <input type="number" min="0" {...registerEdit("experience")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.experience && <span className="text-[10px] text-red-500">{errorsEdit.experience.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">License No.</label>
                            <input {...registerEdit("licenseNumber")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.licenseNumber && <span className="text-[10px] text-red-500">{errorsEdit.licenseNumber.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">License Cat.</label>
                            <select {...registerEdit("licenseCategory")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm">
                                <option value="CLASS_A">Class A</option>
                                <option value="CLASS_B">Class B</option>
                                <option value="CLASS_C">Class C</option>
                                <option value="CLASS_D">Class D</option>
                                <option value="COMMERCIAL">Commercial</option>
                                <option value="HEAVY_VEHICLE">Heavy Vehicle</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">License Expiry</label>
                            <input type="date" {...registerEdit("licenseExpiry")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm text-neutral-600" />
                            {errorsEdit.licenseExpiry && <span className="text-[10px] text-red-500">{errorsEdit.licenseExpiry.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Salary (INR/mo)</label>
                            <input type="number" {...registerEdit("salary")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsEdit.salary && <span className="text-[10px] text-red-500">{errorsEdit.salary.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Safety Score (%)</label>
                            <input type="number" {...registerEdit("safetyScore")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Completion Rate (%)</label>
                            <input type="number" {...registerEdit("tripCompletionRate")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Driver Status</label>
                        <select {...registerEdit("status")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm">
                            <option value="AVAILABLE">Available</option>
                            <option value="ON_TRIP">On Trip</option>
                            <option value="OFF_DUTY">Off Duty</option>
                            <option value="SUSPENDED">Suspended</option>
                        </select>
                    </div>
                    <button type="submit" disabled={isSubmittingEdit} className="mt-4 py-2.5 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingEdit ? "Updating..." : "Update Profile"}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Drivers;
