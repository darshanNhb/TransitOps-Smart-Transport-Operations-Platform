// ─────────────────────────────────────────────────────────────
// End-to-End API Integration Test Script
// ─────────────────────────────────────────────────────────────
// Validates all API endpoints and transaction boundaries against
// the active running TransitOps development server.
// ─────────────────────────────────────────────────────────────

const BASE_URL = "http://localhost:5000/api/v1";

async function runTests() {
    console.log("🧪 Starting TransitOps E2E API Integration Tests...\n");

    const email = `test-manager-${Date.now()}@transitops.com`;
    const password = "Password123!";
    let accessToken = "";
    let vehicleId = "";
    let driverId = "";
    let tripId = "";
    let maintenanceId = "";
    let fuelLogId = "";
    let autoExpenseId = "";
    
    // Helpers
    const req = async (path, method = "GET", body = null) => {
        const headers = { "Content-Type": "application/json" };
        if (accessToken) {
            headers["Authorization"] = `Bearer ${accessToken}`;
        }
        
        const res = await fetch(`${BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        
        const json = await res.json();
        if (!res.ok) {
            throw new Error(`[${method} ${path}] Failed with status ${res.status}: ${JSON.stringify(json)}`);
        }
        return json;
    };

    try {
        // ── 1. Health Check ─────────────────────────────────────
        console.log("➡️ Testing health check...");
        const health = await req("/health");
        console.log("✅ Health check passed:", health.message);

        // ── 2. Register Organization & Admin ─────────────────────
        console.log("\n➡️ Registering new tenant organization & admin user...");
        const regRes = await req("/auth/register", "POST", {
            name: "Enterprise Logistics LLC",
            email,
            password,
            organizationName: "Enterprise Logistics"
        });
        console.log("✅ Registration successful. Tenant User ID:", regRes.data.id);

        // ── 3. Login ────────────────────────────────────────────
        console.log("\n➡️ Logging in to retrieve JWT...");
        const loginRes = await req("/auth/login", "POST", { email, password });
        accessToken = loginRes.data.accessToken;
        console.log("✅ Login successful. Received token.");

        // ── 4. Verify Profile (/me) ──────────────────────────────
        console.log("\n➡️ Checking authenticated profile...");
        const profile = await req("/auth/me");
        console.log("✅ Profile confirmed. Organization:", profile.data.organization.name);

        // ── 5. Create Vehicle ───────────────────────────────────
        console.log("\n➡️ Creating a new active fleet vehicle...");
        const vehicleRes = await req("/vehicles", "POST", {
            registrationNumber: `REG-${Date.now()}`,
            vehicleNumber: `TRK-${Math.floor(Math.random() * 10000)}`,
            name: "Volvo FH16 Semi-Truck",
            manufacturer: "Volvo",
            model: "FH16",
            manufacturingYear: 2024,
            currentOdometer: 12000,
            fuelType: "DIESEL",
            payloadCapacity: 25000,
            purchaseCost: 145000,
            purchaseDate: new Date().toISOString()
        });
        vehicleId = vehicleRes.data.id;
        console.log(`✅ Vehicle created successfully. ID: ${vehicleId} | Odometer: ${vehicleRes.data.currentOdometer}`);

        // ── 6. Create Driver ────────────────────────────────────
        console.log("\n➡️ Registering a certified driver...");
        const driverRes = await req("/drivers", "POST", {
            employeeCode: `DRV-${Math.floor(Math.random() * 10000)}`,
            name: "Marcus Vance",
            email: `marcus-${Date.now()}@transitops.com`,
            phone: "+1-555-0192",
            dateOfBirth: new Date("1992-05-15").toISOString(),
            joiningDate: new Date().toISOString(),
            experience: 6,
            salary: 4800,
            licenseNumber: `DL-TX${Math.floor(Math.random() * 1000000)}`,
            licenseCategory: "CLASS_A",
            licenseExpiry: new Date("2030-05-15").toISOString()
        });
        driverId = driverRes.data.id;
        console.log("✅ Driver registered. Decrypted license confirmation:", driverRes.data.licenseNumber);

        // ── 7. Schedule Trip ────────────────────────────────────
        console.log("\n➡️ Scheduling a delivery trip (Trip status: SCHEDULED)...");
        const tripRes = await req("/trips", "POST", {
            tripNumber: `TRIP-${Date.now()}`,
            vehicleId,
            driverId,
            origin: "Houston Port Terminal",
            destination: "Dallas Distribution Center",
            plannedDistance: 240,
            cargoWeight: 18000,
            estimatedFuel: 95,
            startOdometer: 12000,
            dispatchTime: new Date(Date.now() + 600000).toISOString(), // starts in 10m
            expectedArrival: new Date(Date.now() + 14400000).toISOString(), // arrives in 4h
            revenue: 1250,
            tripType: "OUTBOUND"
        });
        tripId = tripRes.data.id;
        console.log(`✅ Trip scheduled successfully. ID: ${tripId} | Status: ${tripRes.data.status}`);

        // ── 8. Dispatch Trip (Transaction Verification) ──────────
        console.log("\n➡️ Dispatching trip (Transitions Vehicle & Driver statuses to ON_TRIP)...");
        const dispatchRes = await req(`/trips/${tripId}/dispatch`, "PATCH");
        console.log("✅ Trip dispatched. Status:", dispatchRes.data.status);
        
        // Assert Vehicle and Driver statuses are locked
        const checkedVehicle = await req(`/vehicles/${vehicleId}`);
        const checkedDriver = await req(`/drivers/${driverId}`);
        console.log(`🔍 Vehicle Status: ${checkedVehicle.data.status} (Availability: ${checkedVehicle.data.availability})`);
        console.log(`🔍 Driver Status: ${checkedDriver.data.status} (Availability: ${checkedDriver.data.availability})`);

        if (checkedVehicle.data.status !== "ON_TRIP" || checkedDriver.data.status !== "ON_TRIP") {
            throw new Error("FAIL: Vehicle/Driver status mapping failed during dispatch transaction");
        }

        // ── 9. Log Fuel Purchase (Transaction & Auto-Expense check) ──
        console.log("\n➡️ Logging refueling log (Should auto-generate corresponding FUEL Expense)...");
        const fuelRes = await req("/fuel-logs", "POST", {
            vehicleId,
            fuelType: "DIESEL",
            fuelQuantity: 80,
            pricePerLiter: 1.45,
            receiptNumber: `RCPT-${Math.floor(Math.random() * 100000)}`,
            fuelStation: "Pilot Travel Center #44",
            odometerReading: 12150, // vehicle drove 150 miles
            date: new Date().toISOString()
        });
        fuelLogId = fuelRes.data.id;
        
        // Fetch vehicle to ensure odometer updated
        const postFuelVehicle = await req(`/vehicles/${vehicleId}`);
        console.log(`✅ Fuel log written. ID: ${fuelLogId}. Vehicle odometer updated to: ${postFuelVehicle.data.currentOdometer}`);
        
        // Query expenses to find the auto-generated expense
        console.log("🔍 Checking auto-generated expense of category FUEL...");
        const expenses = await req("/expenses");
        const fuelExpense = expenses.data.find(e => e.vehicleId === vehicleId && e.category === "FUEL");
        if (!fuelExpense) {
            throw new Error("FAIL: Fuel log did not auto-generate a FUEL category Expense");
        }
        autoExpenseId = fuelExpense.id;
        console.log(`✅ Auto-generated Fuel Expense found! ID: ${autoExpenseId} | Amount: $${fuelExpense.amount}`);

        // ── 10. Complete Trip ───────────────────────────────────
        console.log("\n➡️ Completing Trip (Releases Vehicle & Driver to AVAILABLE and saves end odometer)...");
        const completeRes = await req(`/trips/${tripId}/complete`, "PATCH", {
            actualDistance: 245,
            actualFuel: 92,
            endOdometer: 12245, // final odometer
            actualArrival: new Date().toISOString()
        });
        console.log("✅ Trip completed. Status:", completeRes.data.status);
        
        // Check released vehicle/driver statuses
        const releaseVehicle = await req(`/vehicles/${vehicleId}`);
        const releaseDriver = await req(`/drivers/${driverId}`);
        console.log(`🔍 Vehicle Released Status: ${releaseVehicle.data.status} | Final Odometer: ${releaseVehicle.data.currentOdometer}`);
        console.log(`🔍 Driver Released Status: ${releaseDriver.data.status}`);

        if (releaseVehicle.data.status !== "AVAILABLE" || releaseDriver.data.status !== "AVAILABLE") {
            throw new Error("FAIL: Vehicle/Driver release mapping failed during complete transaction");
        }

        // ── 11. Schedule & Start Maintenance ───────────────────
        console.log("\n➡️ Scheduling vehicle maintenance session...");
        const maintRes = await req("/maintenance", "POST", {
            vehicleId,
            vendor: "Volvo Truck Service Center",
            serviceType: "Full Engine Tune-up",
            priority: "HIGH",
            description: "Replace engine filters, check belt tension, inspect brakes",
            cost: 850,
            startDate: new Date().toISOString()
        });
        maintenanceId = maintRes.data.id;
        console.log(`✅ Maintenance scheduled. ID: ${maintenanceId} | Status: ${maintRes.data.status}`);

        console.log("➡️ Starting maintenance (Locks vehicle availability)...");
        const startMaint = await req(`/maintenance/${maintenanceId}/start`, "PATCH");
        console.log("✅ Maintenance started. Status:", startMaint.data.status);
        
        const maintVehicle = await req(`/vehicles/${vehicleId}`);
        console.log(`🔍 Vehicle Status: ${maintVehicle.data.status} (Availability: ${maintVehicle.data.availability})`);
        
        if (maintVehicle.data.status !== "IN_MAINTENANCE") {
            throw new Error("FAIL: Vehicle did not lock to IN_MAINTENANCE status");
        }

        // ── 12. Complete Maintenance ─────────────────────────────
        console.log("\n➡️ Completing maintenance (Releases vehicle back to AVAILABLE)...");
        const endMaint = await req(`/maintenance/${maintenanceId}/complete`, "PATCH", {
            invoiceNumber: "INV-VOLVO-88392",
            invoiceDate: new Date().toISOString(),
            remarks: "Replaced oil filter, adjusted front right brake pad. Belt tension verified within bounds.",
            completionDate: new Date().toISOString()
        });
        console.log("✅ Maintenance completed. Status:", endMaint.data.status);

        const endMaintVehicle = await req(`/vehicles/${vehicleId}`);
        console.log(`🔍 Vehicle Status: ${endMaintVehicle.data.status} (Availability: ${endMaintVehicle.data.availability})`);

        // ── 13. Approve Auto-Generated Expense ────────────────────
        console.log("\n➡️ Approving the auto-generated fuel expense...");
        const approveExp = await req(`/expenses/${autoExpenseId}/approve`, "PATCH");
        console.log(`✅ Expense approved. Approved By User ID: ${approveExp.data.approvedById}`);

        // ── 14. Check Notifications ──────────────────────────────
        console.log("\n➡️ Checking user notifications list...");
        const notifications = await req("/notifications");
        console.log(`✅ Retrieved notifications count: ${notifications.data.length}`);

        // ── 15. Check Activity Logs (Audit Trail Verification) ─────
        console.log("\n➡️ Fetching administrative Activity Logs (Audit trail checks)...");
        const logs = await req("/activity-logs");
        console.log(`✅ Retrieved activity logs count: ${logs.data.length}`);
        
        console.log("\nAudit Log Samples:");
        logs.data.slice(0, 5).forEach((log, index) => {
            console.log(`  [Log #${index + 1}] User: ${log.user.name} | Action: ${log.action} | Resource: ${log.resource} | Trace ID: ${log.requestId}`);
        });

        console.log("\n⭐️ ALL E2E INTEGRATION TESTS PASSED SUCCESSFULLY! ⭐️");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ TEST SUITE FAILED WITH ERROR:", error.message);
        process.exit(1);
    }
}

runTests();
