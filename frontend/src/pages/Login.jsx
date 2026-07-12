// ─────────────────────────────────────────────────────────────
// Login Page — Splitted Credentials Panel
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "../context/AuthContext.jsx";
import { Zap, ShieldCheck, Truck, Users, Route, DollarSign } from "lucide-react";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: z.string().min(1, "Please select your active role"),
});

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [serverError, setServerError] = useState("");
    const [rememberMe, setRememberMe] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "demo@transitops.com",
            password: "demo123",
            role: "Fleet Manager",
        },
    });

    const onSubmit = async (data) => {
        setServerError("");
        try {
            // Note: Our backend has role configurations mapping
            // let's pass to login context
            await login(data.email, data.password, data.role);
            navigate("/dashboard");
        } catch (err) {
            setServerError(err.response?.data?.message || "Invalid credentials or account locked.");
        }
    };

    const rolesList = [
        { name: "Fleet Manager", desc: "Full access to all modules", icon: Truck },
        { name: "Dispatcher", desc: "Trips, drivers, and dispatch", icon: Route },
        { name: "Safety Officer", desc: "Driver profiles and compliance", icon: Users },
        { name: "Financial Analyst", desc: "Expenses and analytics", icon: DollarSign },
    ];

    return (
        <div className="flex h-screen w-screen bg-[#fdfbf7] overflow-hidden">
            {/* Left Brand Panel */}
            <div className="hidden lg:flex w-[40%] bg-[#ec4899] text-white flex-col justify-between p-12 select-none relative">
                {/* Logo and brand name */}
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white text-pink-600 rounded-xl flex items-center justify-center shadow-sm">
                        <Zap className="h-5 w-5 fill-current" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold m-0 leading-none">TransitOps</h2>
                        <p className="text-[10px] text-pink-100 mt-1 leading-none">Smart Transport Operations</p>
                    </div>
                </div>

                {/* Subtitle */}
                <div className="my-auto flex flex-col gap-8">
                    <div>
                        <h1 className="text-4xl font-extrabold m-0 leading-tight tracking-tight text-white text-left">
                            One login, four roles
                        </h1>
                        <p className="text-sm text-pink-100 mt-3 text-left max-w-sm">
                            Full control for every team member — access scoped to your function.
                        </p>
                    </div>

                    {/* Roles lists with icons */}
                    <div className="flex flex-col gap-6">
                        {rolesList.map((r, idx) => (
                            <div key={idx} className="flex items-center gap-4 text-left">
                                <div className="h-10 w-10 bg-white/10 rounded-lg flex items-center justify-center">
                                    <r.icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold m-0 text-white leading-none">{r.name}</h4>
                                    <p className="text-xs text-pink-100 mt-1 leading-none">{r.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Left Panel Footer */}
                <div className="text-xs text-pink-200 text-left flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    TransitOps © 2026 · RBAC Enabled
                </div>
            </div>

            {/* Right Form Panel */}
            <div className="flex-1 flex items-center justify-center p-8 bg-[#FAF8F5]">
                <div className="w-full max-w-md bg-white border border-neutral-200 rounded-2xl p-10 shadow-sm">
                    <div className="mb-8 text-center lg:text-left select-none">
                        <h2 className="text-2xl font-bold text-neutral-900 m-0">Sign in</h2>
                        <p className="text-sm text-neutral-400 mt-2">Enter your credentials to continue</p>
                    </div>

                    {serverError && (
                        <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                            {serverError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
                        {/* Email Input */}
                        <div className="flex flex-col gap-2 text-left">
                            <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                                Email
                            </label>
                            <input
                                type="email"
                                {...register("email")}
                                className="w-full px-4 py-3 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 text-sm placeholder-neutral-400"
                                placeholder="name@company.com"
                            />
                            {errors.email && (
                                <span className="text-[11px] text-red-500 font-medium">{errors.email.message}</span>
                            )}
                        </div>

                        {/* Password Input */}
                        <div className="flex flex-col gap-2 text-left">
                            <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                                Password
                            </label>
                            <input
                                type="password"
                                {...register("password")}
                                className="w-full px-4 py-3 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 text-sm placeholder-neutral-400"
                                placeholder="••••••••"
                            />
                            {errors.password && (
                                <span className="text-[11px] text-red-500 font-medium">{errors.password.message}</span>
                            )}
                        </div>

                        {/* Role Select */}
                        <div className="flex flex-col gap-2 text-left">
                            <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                                Role
                            </label>
                            <select
                                {...register("role")}
                                className="w-full px-4 py-3 bg-cream-input border border-neutral-200 rounded-lg focus:outline-none focus:border-pink-500 text-neutral-800 text-sm cursor-pointer"
                            >
                                <option value="Fleet Manager">Fleet Manager</option>
                                <option value="Dispatcher">Dispatcher</option>
                                <option value="Safety Officer">Safety Officer</option>
                                <option value="Financial Analyst">Financial Analyst</option>
                            </select>
                            {errors.role && (
                                <span className="text-[11px] text-red-500 font-medium">{errors.role.message}</span>
                            )}
                        </div>

                        {/* Remember Me & Forgot Password */}
                        <div className="flex items-center justify-between text-xs mt-1 select-none">
                            <label className="flex items-center gap-2 text-neutral-600 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="accent-pink rounded border-neutral-300 focus:ring-pink-500 cursor-pointer"
                                />
                                Remember me
                            </label>
                            <button
                                type="button"
                                className="text-pink-500 hover:text-pink-600 font-semibold cursor-pointer border-none bg-transparent"
                            >
                                Forgot password?
                            </button>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-2 w-full py-3 bg-accent-pink hover:bg-accent-pink-hover disabled:bg-neutral-300 text-white rounded-lg font-semibold text-sm cursor-pointer shadow-sm shadow-pink-100 transition-all"
                        >
                            {isSubmitting ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    {/* Demo users description text */}
                    <p className="text-[11px] text-neutral-400 mt-6 text-center select-none font-medium">
                        Demo: demo@transitops.com / demo123
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
