// ─────────────────────────────────────────────────────────────
// Central Application Routing Matrix
// ─────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Protected from "./routes/Protected.jsx";
import MainLayout from "./layouts/MainLayout.jsx";

// Pages
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Vehicles from "./pages/Vehicles.jsx";
import Drivers from "./pages/Drivers.jsx";
import Trips from "./pages/Trips.jsx";
import Maintenance from "./pages/Maintenance.jsx";
import Expenses from "./pages/Expenses.jsx";
import Analytics from "./pages/Analytics.jsx";
import Settings from "./pages/Settings.jsx";
import Unauthorized from "./pages/Unauthorized.jsx";
import NotFound from "./pages/NotFound.jsx";

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/unauthorized" element={<Unauthorized />} />

                    {/* Authenticated Core Portal Navigation */}
                    <Route path="/" element={<Protected><MainLayout /></Protected>}>
                        <Route index element={<Navigate to="/dashboard" replace />} />
                        <Route path="dashboard" element={<Dashboard />} />

                        <Route
                            path="vehicles"
                            element={
                                <Protected resource="vehicle" action="read">
                                    <Vehicles />
                                </Protected>
                            }
                        />

                        <Route
                            path="drivers"
                            element={
                                <Protected resource="driver" action="read">
                                    <Drivers />
                                </Protected>
                            }
                        />

                        <Route
                            path="trips"
                            element={
                                <Protected resource="trip" action="read">
                                    <Trips />
                                </Protected>
                            }
                        />

                        <Route
                            path="maintenance"
                            element={
                                <Protected resource="maintenance" action="read">
                                    <Maintenance />
                                </Protected>
                            }
                        />

                        <Route
                            path="expenses"
                            element={
                                <Protected resource="expense" action="read">
                                    <Expenses />
                                </Protected>
                            }
                        />

                        <Route
                            path="analytics"
                            element={
                                <Protected resource="report" action="read">
                                    <Analytics />
                                </Protected>
                            }
                        />

                        <Route
                            path="settings"
                            element={
                                <Protected resource="role" action="read">
                                    <Settings />
                                </Protected>
                            }
                        />
                    </Route>

                    {/* Fallback route */}
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
