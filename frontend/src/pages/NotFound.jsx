// ─────────────────────────────────────────────────────────────
// NotFound Page (404)
// ─────────────────────────────────────────────────────────────

import { HelpCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-cream-light p-6 select-none">
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 max-w-md w-full shadow-sm text-center flex flex-col items-center gap-4">
                <HelpCircle className="h-16 w-16 text-neutral-400 stroke-[1.5]" />
                <h2 className="text-xl font-bold text-neutral-800 m-0">Page Not Found</h2>
                <p className="text-sm text-neutral-500 m-0">
                    The requested page does not exist or has been relocated.
                </p>
                <button
                    onClick={() => navigate("/dashboard")}
                    className="mt-2 py-2 px-6 bg-accent-pink hover:bg-accent-pink-hover text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm shadow-pink-100 transition-colors"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default NotFound;
