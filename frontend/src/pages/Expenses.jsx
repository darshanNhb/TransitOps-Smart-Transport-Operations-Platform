// ─────────────────────────────────────────────────────────────
// Fuel & Expenses Page — Operational Costs Dashboards
// ─────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import client from "../api/client.js";
import Modal from "../components/Modal.jsx";
import { Search, Plus, Loader2, DollarSign, Fuel as FuelIcon, Receipt, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const logFuelSchema = z.object({
    vehicleId: z.string().uuid("Please select a vehicle"),
    liters: z.coerce.number().positive("Must be positive"),
    pricePerLiter: z.coerce.number().positive("Must be positive"),
    odometer: z.coerce.number().int().positive("Must be positive"),
});

const addExpenseSchema = z.object({
    tripId: z.union([z.string().uuid("Please select a trip"), z.literal("")]).optional().nullable(),
    category: z.enum(["TOLL", "MAINTENANCE", "FUEL", "OTHER"]),
    amount: z.coerce.number().positive("Must be positive"),
    description: z.string().min(3, "Required").max(200),
    referenceNumber: z.string().min(2, "Required").max(50),
});

const Expenses = () => {
    const { user, hasPerm } = useAuth();
    const [fuelLogs, setFuelLogs] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modals
    const [isFuelOpen, setIsFuelOpen] = useState(false);
    const [isExpenseOpen, setIsExpenseOpen] = useState(false);

    // Toast state
    const [toast, setToast] = useState({ show: false, message: "", type: "success" });

    const showToast = (message, type = "success") => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
    };

    const loadFinancialData = async () => {
        try {
            setLoading(true);
            const [fuelRes, expRes, vehRes, tripRes] = await Promise.all([
                client.get("/fuel-logs?limit=100"),
                client.get("/expenses?limit=100"),
                client.get("/vehicles?limit=100"),
                client.get("/trips?limit=100"),
            ]);

            setFuelLogs(fuelRes.data.data);
            setExpenses(expRes.data.data);
            setVehicles(vehRes.data.data);
            setTrips(tripRes.data.data);
        } catch (err) {
            showToast("Failed to retrieve financial logs", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFinancialData();
    }, []);

    const {
        register: registerFuel,
        handleSubmit: handleSubmitFuel,
        reset: resetFuel,
        formState: { errors: errorsFuel, isSubmitting: isSubmittingFuel },
    } = useForm({
        resolver: zodResolver(logFuelSchema),
    });

    const {
        register: registerExpense,
        handleSubmit: handleSubmitExpense,
        reset: resetExpense,
        formState: { errors: errorsExpense, isSubmitting: isSubmittingExpense },
    } = useForm({
        resolver: zodResolver(addExpenseSchema),
        defaultValues: {
            category: "TOLL",
        },
    });

    const onFuelSubmit = async (data) => {
        try {
            const payload = {
                vehicleId: data.vehicleId,
                fuelQuantity: data.liters,
                pricePerLiter: data.pricePerLiter,
                odometerReading: data.odometer,
                fuelType: "DIESEL",
                date: new Date().toISOString()
            };
            await client.post("/fuel-logs", payload);
            showToast("Fuel log registered successfully");
            setIsFuelOpen(false);
            resetFuel();
            loadFinancialData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to log fuel refill", "error");
        }
    };

    const onExpenseSubmit = async (data) => {
        try {
            const payload = {
                category: data.category,
                amount: data.amount,
                description: data.referenceNumber ? `${data.description} (Ref: ${data.referenceNumber})` : data.description,
                paymentMethod: "CASH",
                date: new Date().toISOString(),
                tripId: data.tripId || null,
            };
            await client.post("/expenses", payload);
            showToast("Expense record added successfully");
            setIsExpenseOpen(false);
            resetExpense();
            loadFinancialData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to record expense", "error");
        }
    };

    const handleApproveExpense = async (expenseId) => {
        try {
            await client.patch(`/expenses/${expenseId}/approve`);
            showToast("Expense verified and approved");
            loadFinancialData();
        } catch (err) {
            showToast(err.response?.data?.message || "Failed to approve expense", "error");
        }
    };

    // Aggregate values
    const totalFuelCosts = fuelLogs.reduce((sum, f) => sum + (Number(f.fuelQuantity) * Number(f.pricePerLiter)), 0);
    const totalMaintCosts = expenses.filter(e => e.category === "SERVICE").reduce((sum, e) => sum + Number(e.amount), 0);
    const totalOpsCosts = totalFuelCosts + totalMaintCosts;

    // Filter calculations
    const filteredFuelLogs = fuelLogs.filter((f) => {
        return (
            f.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase()) ||
            f.vehicle?.vehicleNumber?.toLowerCase().includes(search.toLowerCase())
        );
    });

    const filteredExpenses = expenses.filter((e) => {
        return (
            e.category?.toLowerCase().includes(search.toLowerCase()) ||
            e.description?.toLowerCase().includes(search.toLowerCase()) ||
            e.trip?.tripNumber?.toLowerCase().includes(search.toLowerCase()) ||
            e.vehicle?.registrationNumber?.toLowerCase().includes(search.toLowerCase())
        );
    });

    const formatLogDate = (dateStr) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${d.getDate().toString().padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
    };

    return (
        <div className="flex flex-col gap-6 text-left">
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

            {/* Filter search bar */}
            <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl p-4 shadow-sm select-none">
                <div className="relative w-80">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                        <Search className="h-4 w-4" />
                    </span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search logs and expenses..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 placeholder-neutral-400"
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-12 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                </div>
            ) : (
                <>
                    {/* Fuel Logs Section */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4 select-none">
                            <h3 className="text-base font-bold text-neutral-800 m-0">Fuel Logs</h3>
                            {hasPerm("fuel", "create") && (
                                <button
                                    onClick={() => setIsFuelOpen(true)}
                                    className="bg-accent-pink hover:bg-accent-pink-hover text-white px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Log Fuel
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-100 select-none text-[11px] text-neutral-400 uppercase tracking-wider font-bold">
                                        <th className="pb-3 pr-2">Vehicle</th>
                                        <th className="pb-3 px-2">Date</th>
                                        <th className="pb-3 px-2">Liters</th>
                                        <th className="pb-3 px-2">Cost</th>
                                        <th className="pb-3 px-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFuelLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="py-6 text-center text-neutral-400 font-medium">
                                                No fuel refilling records found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredFuelLogs.map((log, idx) => (
                                            <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors">
                                                <td className="py-3.5 pr-2 font-bold text-pink-500 text-xs">
                                                    {log.vehicle?.vehicleNumber || log.vehicle?.name || "N/A"}
                                                </td>
                                                <td className="py-3.5 px-2 text-xs font-semibold text-neutral-500">
                                                    {formatLogDate(log.createdAt)}
                                                </td>
                                                <td className="py-3.5 px-2 text-xs text-neutral-700 font-mono">
                                                    {log.fuelQuantity}L
                                                </td>
                                                <td className="py-3.5 px-2 text-xs text-neutral-800 font-bold font-mono">
                                                    ₹{(Number(log.fuelQuantity) * Number(log.pricePerLiter)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </td>
                                                <td className="py-3.5 px-2">
                                                    <span className="bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none inline-block">
                                                        Verified
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4 select-none">
                            <h3 className="text-base font-bold text-neutral-800 m-0">Other Expenses (Toll / Misc)</h3>
                            {hasPerm("expense", "create") && (
                                <button
                                    onClick={() => setIsExpenseOpen(true)}
                                    className="bg-accent-pink hover:bg-accent-pink-hover text-white px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add Expense
                                </button>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-100 select-none text-[11px] text-neutral-400 uppercase tracking-wider font-bold">
                                        <th className="pb-3 pr-2">Trip</th>
                                        <th className="pb-3 px-2">Vehicle</th>
                                        <th className="pb-3 px-2">Toll</th>
                                        <th className="pb-3 px-2">Other</th>
                                        <th className="pb-3 px-2">Maint. Linked</th>
                                        <th className="pb-3 px-2">Total</th>
                                        <th className="pb-3 px-2">Status</th>
                                        {hasPerm("expense", "approve") && <th className="pb-3 pl-2 text-right">Action</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.length === 0 ? (
                                        <tr>
                                            <td colSpan="8" className="py-6 text-center text-neutral-400 font-medium">
                                                No expense invoices logged.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredExpenses.map((exp, idx) => {
                                            const isPending = !exp.approvedById;
                                            return (
                                                <tr key={idx} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-colors">
                                                    <td className="py-3.5 pr-2 font-bold text-pink-500 text-xs">
                                                        {exp.trip?.tripNumber
                                                            ? <span className="font-bold text-pink-500">{exp.trip.tripNumber}</span>
                                                            : <span className="text-neutral-300 font-normal">—</span>
                                                        }
                                                    </td>
                                                    <td className="py-3.5 px-2 text-xs font-semibold text-neutral-700">
                                                        {exp.vehicle?.vehicleNumber || exp.vehicle?.name || "N/A"}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-xs text-neutral-600 font-mono">
                                                        ₹{(exp.category === "TOLL" ? Number(exp.amount) : 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-xs text-neutral-600 font-mono">
                                                        ₹{(exp.category === "MISCELLANEOUS" ? Number(exp.amount) : 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-xs text-neutral-600 font-mono">
                                                        ₹{(exp.category === "SERVICE" ? Number(exp.amount) : 0).toFixed(2)}
                                                    </td>
                                                    <td className="py-3.5 px-2 text-xs text-neutral-800 font-black font-mono">
                                                        ₹{Number(exp.amount).toFixed(2)}
                                                    </td>
                                                    <td className="py-3.5 px-2">
                                                        <span className={isPending ? "bg-pink-100 text-pink-700 border border-pink-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none" : "bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-md text-xs font-semibold select-none"}>
                                                            {isPending ? "Pending" : "Settled"}
                                                        </span>
                                                    </td>
                                                    {hasPerm("expense", "approve") && (
                                                        <td className="py-3.5 pl-2 text-right">
                                                            {isPending && (
                                                                <button
                                                                    onClick={() => handleApproveExpense(exp.id)}
                                                                    className="text-green-600 hover:text-green-700 font-bold text-xs flex items-center justify-end gap-1 cursor-pointer transition-colors border-none bg-transparent"
                                                                >
                                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                                    Approve
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
                    </div>

                    {/* Bottom Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-none font-bold">
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-28">
                            <h5 className="text-[10px] uppercase font-bold text-neutral-400 m-0 tracking-wider">Total Fuel Costs</h5>
                            <p className="text-2xl font-black text-blue-500 m-0 leading-none mt-3">
                                ₹{totalFuelCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-28">
                            <h5 className="text-[10px] uppercase font-bold text-neutral-400 m-0 tracking-wider">Total Maintenance Costs</h5>
                            <p className="text-2xl font-black text-rose-500 m-0 leading-none mt-3">
                                ₹{totalMaintCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                        </div>
                        <div className="bg-pink-50 border border-pink-200 rounded-xl p-5 shadow-sm flex flex-col justify-between h-28 text-pink-700">
                            <h5 className="text-[10px] uppercase font-bold text-pink-400 m-0 tracking-wider">Total Operational Cost (Auto)</h5>
                            <div>
                                <p className="text-2xl font-black text-pink-600 m-0 leading-none">
                                    ₹{totalOpsCosts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </p>
                                <span className="text-[10px] text-pink-400 font-semibold block mt-1">Fuel + Maintenance</span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Modal: Log Fuel */}
            <Modal isOpen={isFuelOpen} onClose={() => setIsFuelOpen(false)} title="Log Refueling Log">
                <form onSubmit={handleSubmitFuel(onFuelSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Select Target Vehicle</label>
                        <select {...registerFuel("vehicleId")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600">
                            <option value="">-- Choose Vehicle --</option>
                            {vehicles.map((v) => (
                                <option key={v.id} value={v.id}>{v.registrationNumber} ({v.name})</option>
                            ))}
                        </select>
                        {errorsFuel.vehicleId && <span className="text-[10px] text-red-500">{errorsFuel.vehicleId.message}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Volume (Liters)</label>
                            <input type="number" {...registerFuel("liters")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsFuel.liters && <span className="text-[10px] text-red-500">{errorsFuel.liters.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Price per Liter (INR)</label>
                            <input type="number" step="0.01" {...registerFuel("pricePerLiter")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsFuel.pricePerLiter && <span className="text-[10px] text-red-500">{errorsFuel.pricePerLiter.message}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Odometer at refill (km)</label>
                        <input type="number" {...registerFuel("odometer")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                        {errorsFuel.odometer && <span className="text-[10px] text-red-500">{errorsFuel.odometer.message}</span>}
                    </div>
                    <button type="submit" disabled={isSubmittingFuel} className="mt-4 py-2.5 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingFuel ? "Submitting..." : "Save Refuel Log"}
                    </button>
                </form>
            </Modal>

            {/* Modal: Add Expense */}
            <Modal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} title="Add Expense Record">
                <form onSubmit={handleSubmitExpense(onExpenseSubmit)} className="flex flex-col gap-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Select Category</label>
                            <select {...registerExpense("category")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600">
                                <option value="TOLL">Toll Charge</option>
                                <option value="OTHER">Miscellaneous / Other</option>
                                <option value="MAINTENANCE">Maintenance Linked</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Linked Trip (Optional)</label>
                            <select {...registerExpense("tripId")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none text-sm text-neutral-600">
                                <option value="">-- No Linked Trip --</option>
                                {trips.map((t) => (
                                    <option key={t.id} value={t.id}>{t.tripNumber} ({t.origin} ➔ {t.destination})</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Invoiced Amount (INR)</label>
                            <input type="number" {...registerExpense("amount")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" />
                            {errorsExpense.amount && <span className="text-[10px] text-red-500">{errorsExpense.amount.message}</span>}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-neutral-500 uppercase">Receipt/Ref Number</label>
                            <input {...registerExpense("referenceNumber")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="INV-48202" />
                            {errorsExpense.referenceNumber && <span className="text-[10px] text-red-500">{errorsExpense.referenceNumber?.message}</span>}
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">Detailed Description</label>
                        <textarea rows="3" {...registerExpense("description")} className="px-3 py-2 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-sm" placeholder="Provide billing summary..."></textarea>
                        {errorsExpense.description && <span className="text-[10px] text-red-500">{errorsExpense.description.message}</span>}
                    </div>
                    <button type="submit" disabled={isSubmittingExpense} className="mt-4 py-2.5 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-200 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm">
                        {isSubmittingExpense ? "Submitting..." : "Save Expense Record"}
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default Expenses;
