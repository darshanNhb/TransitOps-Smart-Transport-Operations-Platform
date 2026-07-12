// ─────────────────────────────────────────────────────────────
// Maintenance Page — Service Records & Asset Lock CRUD
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client.js";
import Modal from "../components/Modal.jsx";
import { Search, Plus, Loader2, ChevronLeft, ChevronRight, CheckSquare, Wrench } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const createMaintSchema = z.object({
    vehicleId: z.string().uuid("Please select a vehicle"),
    serviceType: z.string().min(2, "Required").max(100),
    description: z.string().min(5, "Required").max(500),
    estimatedCost: z.coerce.number().positive("Must be positive"),
    scheduledDate: z.string().min(10, "Required"),
});

const closeMaintSchema = z.object({
    actualCost: z.coerce.number().positive("Must be positive"),
    completionDate: z.string().min(10, "Required"),
});

const Maintenance = () => {
    const { user, hasPerm } = useAuth();
    const [records, setRecords] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    
    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const limit = 5;

    // Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isCloseOpen, setIsCloseOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    const loadRecordsAndVehicles = async () => {
        try {
            setLoading(true);
            const [maintRes, vehRes] = await Promise.all([
                client.get(`/maintenance?page=${page}&limit=${limit}`),
                client.get("/vehicles?limit=100"),
            ]);

            setRecords(maintRes.data.data);
            setTotalPages(maintRes.data.meta?.pagination?.totalPages || 1);
            setTotalItems(maintRes.data.meta?.pagination?.totalItems || 0);
            setVehicles(vehRes.data.data);
        } catch (err) {
            showToast("Failed to load maintenance records", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadRecordsAndVehicles();
    }, [page]);

    const {
        register: registerCreate,
        handleSubmit: handleSubmitCreate,
        reset: resetCreate,
        formState: { errors: errorsCreate, isSubmitting: isSubmittingCreate },
    } = useForm({
        resolver: zodResolver(createMaintSchema),
        defaultValues: {
            scheduledDate: new Date().toISOString().substring(0, 10),
        },
    });

    const {
        register: registerClose,
        handleSubmit: handleSubmitClose,
        reset: resetClose,
        formState: { errors: errorsClose, isSubmitting: isSubmittingClose },
    } = useForm({
        resolver: zodResolver(closeMaintSchema),
    });

    const onCreateSubmit = async (data) => {
        try {
            const formatted = {
                ...data,
                scheduledDate: new Date(data.scheduledDate).toISOString(),
            };
            const res = await client.post("/maintenance", formatted);
            const newRecord = res.data.data;

            // Automatically commence/start service session to lock vehicle immediately
            await client.patch(`/maintenance/${newRecord.id}/start`);

            showToast("Service record logged and locked into IN_MAINTENANCE status!");
            setIsCreateOpen(false);
            resetCreate();
            loadRecordsAndVehicles();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to log service record", "error");
        }
    };

    const openCloseModal = (record) => {
        setSelectedRecord(record);
        resetClose({
            actualCost: record.estimatedCost,
            completionDate: new Date().toISOString().substring(0, 10),
        });
        setIsCloseOpen(true);
    };

    const onCloseSubmit = async (data) => {
        try {
            const formatted = {
                ...data,
                completionDate: new Date(data.completionDate).toISOString(),
            };
            await client.patch(`/maintenance/${selectedRecord.id}/complete`, formatted);
            showToast("Service record closed and vehicle released to AVAILABLE!");
            setIsCloseOpen(false);
            loadRecordsAndVehicles();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to close service record", "error");
        }
    };

    const formatRecordDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    // Filter list for search bar query
    const filteredRecords = records.filter((r) => {
        return (
            r.vehicle?.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
            r.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
            r.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
            r.description?.toLowerCase().includes(search.toLowerCase())
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

            {/* Stepper Decorative Pills Header */}
            <div className="flex items-center gap-3 select-none text-xs font-bold text-neutral-400">
                <span className="bg-green-50 border border-green-200 text-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    Available
                </span>
                <span>➔</span>
                <span className="bg-orange-50 border border-orange-200 text-orange-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                    In Shop
                </span>
                <span className="text-neutral-300 ml-2">Active record .. Closing record</span>
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
                        placeholder="Search service records..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 placeholder-neutral-400"
                    />
                </div>

                {hasPerm("maintenance", "create") && (
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-accent-pink hover:bg-accent-pink-hover text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors cursor-pointer shadow-sm shadow-pink-100"
                    >
                        <Plus className="h-4 w-4" />
                        Log Service Record
                    </button>
                )}
            </div>

            {/* Maintenance Log Table */}
            <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead>
                            <tr className="border-b border-neutral-100 select-none text-[11px] text-neutral-400 uppercase tracking-wider font-bold">
                                <th className="pb-3 pr-2">Vehicle</th>
                                <th className="pb-3 px-2">Service Type</th>
                                <th className="pb-3 px-2">Cost</th>
                                <th className="pb-3 px-2">Date</th>
                                <th className="pb-3 px-2">Status</th>
                                {hasPerm("maintenance", "update") && <th className="pb-3 pl-2 text-right">Actions</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-neutral-400">
                                        <Loader2 className="h-6 w-6 animate-spin text-pink-500 mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-8 text-center text-neutral-400 font-medium">
                                        No maintenance logs found.
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map((record, idx) => {
                                    const isActive = record.status === "IN_PROGRESS" || record.status === "SCHEDULED";
                                    return (
                                        <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors">
                                            <td className="py-4 pr-2 font-bold text-pink-500 text-xs">
                                                {record.vehicle?.vehicleNumber || record.vehicle?.name || "N/A"}
                                            </td>
                                            <td className="py-4 px-2 text-xs font-semibold text-neutral-700">
                                                {record.serviceType}
                                            </td>
                                            <td className="py-4 px-2 text-xs text-neutral-600 font-mono">
                                                ₹{Number(record.cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="py-4 px-2 text-xs text-neutral-500 font-semibold">
                                                {formatRecordDate(isActive ? record.scheduledDate : record.completionDate)}
                                            </td>
                                            <td className="py-4 px-2">
                                                <span className={isActive ? "bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none inline-block" : "bg-neutral-100 text-neutral-500 border border-neutral-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none inline-block"}>
                                                    {isActive ? "Active" : "Completed"}
                                                </span>
                                            </td>
                                            {hasPerm("maintenance", "update") && (
                                                <td className="py-4 pl-2 text-right">
                                                    {isActive && (
                                                        <button
                                                            onClick={() => openCloseModal(record)}
                                                            className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                                        >
                                                            Close
                                                        </button>
                                                    )}
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

            {/* Modal: Create Maintenance Record */}
            <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Log Fleet Service Record">
                <form onSubmit={handleSubmitCreate(onCreateSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Select Target Vehicle</label>
                            <select {...registerCreate("vehicleId")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600">
                                <option value="">-- Choose Vehicle --</option>
                                {vehicles.map((v) => (
                                    <option key={v.id} value={v.id}>{v.registrationNumber} ({v.name})</option>
                                ))}
                            </select>
                            {errorsCreate.vehicleId && <span className="text-[10px] text-red-500">{errorsCreate.vehicleId.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Service Category</label>
                            <input {...registerCreate("serviceType")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="e.g. Engine Overhaul" />
                            {errorsCreate.serviceType && <span className="text-[10px] text-red-500">{errorsCreate.serviceType.message}</span>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Estimated Cost (INR)</label>
                            <input type="number" {...registerCreate("estimatedCost")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsCreate.estimatedCost && <span className="text-[10px] text-red-500">{errorsCreate.estimatedCost.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Scheduled Date</label>
                            <input type="date" {...registerCreate("scheduledDate")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600" />
                            {errorsCreate.scheduledDate && <span className="text-[10px] text-red-500">{errorsCreate.scheduledDate.message}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Detailed Description</label>
                        <textarea rows="3" {...registerCreate("description")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="Provide details of works required..."></textarea>
                        {errorsCreate.description && <span className="text-[10px] text-red-500">{errorsCreate.description.message}</span>}
                    </div>
                    <button type="submit" disabled={isSubmittingCreate} className="mt-4 py-2.5 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingCreate ? "Submitting..." : "Log & Lock Vehicle In Shop"}
                    </button>
                </form>
            </Modal>

            {/* Modal: Close Maintenance Record */}
            <Modal isOpen={isCloseOpen} onClose={() => setIsCloseOpen(false)} title="Close Out Service Session">
                <form onSubmit={handleSubmitClose(onCloseSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Actual cost incurred (INR)</label>
                            <input type="number" {...registerClose("actualCost")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsClose.actualCost && <span className="text-[10px] text-red-500">{errorsClose.actualCost.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Completion Date</label>
                            <input type="date" {...registerClose("completionDate")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600" />
                            {errorsClose.completionDate && <span className="text-[10px] text-red-500">{errorsClose.completionDate.message}</span>}
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmittingClose} className="mt-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingClose ? "Completing..." : "Complete Service & Release Vehicle"}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Maintenance;
