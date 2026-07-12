// ─────────────────────────────────────────────────────────────
// Reusable Modal Component
// ─────────────────────────────────────────────────────────────

import { X } from "lucide-react";

const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white border border-neutral-200 rounded-2xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4 select-none">
                    <h3 className="text-base font-bold text-neutral-800 m-0">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-neutral-400 hover:text-neutral-600 transition-colors cursor-pointer border-none bg-transparent"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                {/* Content */}
                <div className="flex-1 overflow-y-auto pr-1">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
