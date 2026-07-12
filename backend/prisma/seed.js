// ─────────────────────────────────────────────────────────────
// Database Seeder
// ─────────────────────────────────────────────────────────────
// Seeds the default system permissions required for the dynamic
// RBAC mapping. Running `npx prisma db seed` populates these.
// Also seeds the demo organization, roles, users, and core data.
// ─────────────────────────────────────────────────────────────

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Setup Prisma Client using the correct Prisma 7 adapter configuration
const dbPath = path.resolve(__dirname, "../dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log("🌱 Starting database seeding...");

    // 1. Permissions List
    const permissionsList = [
        // Vehicles
        { resource: "vehicle", action: "create" },
        { resource: "vehicle", action: "read" },
        { resource: "vehicle", action: "update" },
        { resource: "vehicle", action: "delete" },
        
        // Drivers
        { resource: "driver", action: "create" },
        { resource: "driver", action: "read" },
        { resource: "driver", action: "update" },
        { resource: "driver", action: "delete" },
        
        // Trips
        { resource: "trip", action: "create" },
        { resource: "trip", action: "read" },
        { resource: "trip", action: "update" },
        { resource: "trip", action: "delete" },
        { resource: "trip", action: "dispatch" },
        { resource: "trip", action: "complete" },
        { resource: "trip", action: "cancel" },
        
        // Maintenance
        { resource: "maintenance", action: "create" },
        { resource: "maintenance", action: "read" },
        { resource: "maintenance", action: "update" },
        { resource: "maintenance", action: "delete" },
        { resource: "maintenance", action: "start" },
        { resource: "maintenance", action: "complete" },
        
        // Fuel Logs
        { resource: "fuel", action: "create" },
        { resource: "fuel", action: "read" },
        { resource: "fuel", action: "update" },
        { resource: "fuel", action: "delete" },
        
        // Expenses
        { resource: "expense", action: "create" },
        { resource: "expense", action: "read" },
        { resource: "expense", action: "update" },
        { resource: "expense", action: "delete" },
        { resource: "expense", action: "approve" },
        
        // Reports & Dashboards
        { resource: "report", action: "read" },
        { resource: "report", action: "generate" },
        { resource: "dashboard", action: "read" },
        
        // System Settings
        { resource: "user", action: "create" },
        { resource: "user", action: "read" },
        { resource: "user", action: "update" },
        { resource: "user", action: "delete" },
        { resource: "role", action: "create" },
        { resource: "role", action: "read" },
        { resource: "role", action: "update" },
        { resource: "organization", action: "read" },
        { resource: "organization", action: "update" },
        { resource: "notification", action: "create" },
        { resource: "notification", action: "read" },
        { resource: "notification", action: "update" },
        { resource: "notification", action: "delete" },
    ];

    console.log(`Upserting ${permissionsList.length} permissions...`);
    const permMap = {};
    for (const perm of permissionsList) {
        const p = await prisma.permission.upsert({
            where: {
                resource_action: {
                    resource: perm.resource,
                    action: perm.action,
                },
            },
            update: {},
            create: perm,
        });
        permMap[`${perm.resource}:${perm.action}`] = p.id;
    }

    // 2. Demo Organization
    console.log("Upserting organization...");
    const org = await prisma.organization.upsert({
        where: { slug: "transitops-demo-depot" },
        update: {},
        create: {
            name: "TransitOps Central Depot",
            slug: "transitops-demo-depot",
            currency: "USD",
            timezone: "America/New_York",
        },
    });

    // 3. Clean all existing referencing records for this organization first (Cascade order)
    console.log("Cleaning old database mock records to avoid foreign-key constraint conflicts...");
    await prisma.activityLog.deleteMany({ where: { organizationId: org.id } });
    await prisma.notification.deleteMany({ where: { organizationId: org.id } });
    await prisma.expense.deleteMany({ where: { organizationId: org.id } });
    await prisma.fuelLog.deleteMany({ where: { organizationId: org.id } });
    await prisma.maintenance.deleteMany({ where: { organizationId: org.id } });
    await prisma.trip.deleteMany({ where: { organizationId: org.id } });
    await prisma.driver.deleteMany({ where: { organizationId: org.id } });
    await prisma.vehicle.deleteMany({ where: { organizationId: org.id } });

    // 4. Roles
    console.log("Upserting roles...");
    const roles = [
        { name: "Fleet Manager", description: "Full access to all modules" },
        { name: "Dispatcher", description: "Trips, drivers, and dispatch" },
        { name: "Safety Officer", description: "Driver profiles and compliance" },
        { name: "Financial Analyst", description: "Expenses and analytics" },
    ];

    const roleMap = {};
    for (const r of roles) {
        const role = await prisma.role.upsert({
            where: {
                organizationId_name: {
                    organizationId: org.id,
                    name: r.name,
                },
            },
            update: {},
            create: {
                name: r.name,
                description: r.description,
                organizationId: org.id,
            },
        });
        roleMap[r.name] = role;
    }

    // 5. Map Role Permissions matching RBAC Grid mockup
    console.log("Mapping role permissions...");
    // Clear old mappings to prevent duplication issues
    await prisma.rolePermission.deleteMany({
        where: {
            roleId: {
                in: Object.values(roleMap).map((r) => r.id),
            },
        },
    });

    // Fleet Manager gets all
    const allPerms = Object.values(permMap);
    await prisma.rolePermission.createMany({
        data: allPerms.map((pid) => ({
            roleId: roleMap["Fleet Manager"].id,
            permissionId: pid,
        })),
    });

    // Dispatcher: Fleet (view/read), Drivers (read, create, update), Trips (read, create, update, dispatch, complete, cancel)
    const dispatcherPerms = [
        "vehicle:read",
        "driver:read", "driver:create", "driver:update",
        "trip:read", "trip:create", "trip:update", "trip:dispatch", "trip:complete", "trip:cancel",
        "dashboard:read",
    ].map(k => permMap[k]).filter(Boolean);
    await prisma.rolePermission.createMany({
        data: dispatcherPerms.map((pid) => ({
            roleId: roleMap["Dispatcher"].id,
            permissionId: pid,
        })),
    });

    // Safety Officer: Fleet (view/read), Drivers (read, create, update)
    const safetyPerms = [
        "vehicle:read",
        "driver:read", "driver:create", "driver:update",
        "dashboard:read",
    ].map(k => permMap[k]).filter(Boolean);
    await prisma.rolePermission.createMany({
        data: safetyPerms.map((pid) => ({
            roleId: roleMap["Safety Officer"].id,
            permissionId: pid,
        })),
    });

    // Financial Analyst: Fleet (view/read), Expenses (read, create, update, approve), Fuel (read, create), Reports (read)
    const financePerms = [
        "vehicle:read",
        "expense:read", "expense:create", "expense:update", "expense:approve",
        "fuel:read", "fuel:create",
        "report:read",
        "dashboard:read",
    ].map(k => permMap[k]).filter(Boolean);
    await prisma.rolePermission.createMany({
        data: financePerms.map((pid) => ({
            roleId: roleMap["Financial Analyst"].id,
            permissionId: pid,
        })),
    });

    // 6. Users
    console.log("Upserting demo users...");
    const passwordHash = await bcrypt.hash("demo123", 12);
    const users = [
        { email: "demo@transitops.com", name: "Ravon K.", roleName: "Fleet Manager" },
        { email: "dispatcher@transitops.com", name: "Sarah Connor", roleName: "Dispatcher" },
        { email: "safety@transitops.com", name: "Marcus Wright", roleName: "Safety Officer" },
        { email: "finance@transitops.com", name: "Kyle Reese", roleName: "Financial Analyst" },
    ];

    const userMap = {};
    for (const u of users) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                name: u.name,
                passwordHash,
                organizationId: org.id,
                roleId: roleMap[u.roleName].id,
                status: "ACTIVE",
            },
        });
        userMap[u.email] = user;
    }

    const adminUserId = userMap["demo@transitops.com"].id;

    // 7. Seed mock vehicles
    console.log("Seeding mock vehicles...");
    const vehiclesData = [
        { registrationNumber: "VAN-05", vehicleNumber: "V-05", name: "Transit Van 05", manufacturer: "Ford", model: "Transit", manufacturingYear: 2022, fuelType: "DIESEL", payloadCapacity: 1500, purchaseCost: 28000, purchaseDate: new Date("2022-04-12"), currentOdometer: 42000, status: "AVAILABLE", availability: true },
        { registrationNumber: "TRUCK-11", vehicleNumber: "T-11", name: "Heavy Truck 11", manufacturer: "Volvo", model: "FH16", manufacturingYear: 2021, fuelType: "DIESEL", payloadCapacity: 8000, purchaseCost: 75000, purchaseDate: new Date("2021-06-18"), currentOdometer: 120000, status: "ON_TRIP", availability: false },
        { registrationNumber: "MINI-03", vehicleNumber: "M-03", name: "Mini Van 03", manufacturer: "Toyota", model: "Sienna", manufacturingYear: 2023, fuelType: "UNLEADED", payloadCapacity: 8000, purchaseCost: 18000, purchaseDate: new Date("2023-01-15"), currentOdometer: 31000, status: "IN_MAINTENANCE", availability: false },
        { registrationNumber: "BUS-07", vehicleNumber: "B-07", name: "Passenger Bus 07", manufacturer: "Mercedes", model: "Sprinter", manufacturingYear: 2020, fuelType: "UNLEADED", payloadCapacity: 3000, purchaseCost: 55000, purchaseDate: new Date("2020-09-09"), currentOdometer: 88000, status: "AVAILABLE", availability: true },
        { registrationNumber: "PICKUP-02", vehicleNumber: "P-02", name: "Pickup Truck 02", manufacturer: "RAM", model: "1500", manufacturingYear: 2019, fuelType: "UNLEADED", payloadCapacity: 1200, purchaseCost: 22000, purchaseDate: new Date("2019-11-20"), currentOdometer: 57000, status: "RETIRED", availability: false },
    ];

    const vehicleMap = {};
    for (const v of vehiclesData) {
        const vehicle = await prisma.vehicle.create({
            data: { ...v, organizationId: org.id }
        });
        vehicleMap[v.registrationNumber] = vehicle;
    }

    // 8. Seed mock drivers
    console.log("Seeding mock drivers...");
    const driversData = [
        { name: "Alex Johnson", email: "alex@transitops.com", phone: "+1-555-0101", licenseNumber: "DL-AJ-001", licenseCategory: "CLASS_A", licenseExpiry: new Date("2026-12-31"), dateOfBirth: new Date("1988-04-14"), salary: "4500", status: "AVAILABLE", safetyScore: 92, employeeCode: "EMP-001", joiningDate: new Date("2020-03-10"), experience: 8 },
        { name: "Ivan Petrov", email: "ivan@transitops.com", phone: "+1-555-0102", licenseNumber: "DL-IP-002", licenseCategory: "CLASS_B", licenseExpiry: new Date("2025-06-15"), dateOfBirth: new Date("1990-09-22"), salary: "4000", status: "ON_TRIP", safetyScore: 85, employeeCode: "EMP-002", joiningDate: new Date("2021-05-18"), experience: 6 },
        { name: "Priya Sharma", email: "priya@transitops.com", phone: "+1-555-0103", licenseNumber: "DL-PS-003", licenseCategory: "CLASS_A", licenseExpiry: new Date("2027-03-20"), dateOfBirth: new Date("1992-12-05"), salary: "4800", status: "AVAILABLE", safetyScore: 97, employeeCode: "EMP-003", joiningDate: new Date("2019-11-20"), experience: 5 },
        { name: "Suresh Kumar", email: "suresh@transitops.com", phone: "+1-555-0104", licenseNumber: "DL-SK-004", licenseCategory: "CLASS_C", licenseExpiry: new Date("2026-08-10"), dateOfBirth: new Date("1985-02-28"), salary: "3800", status: "OFF_DUTY", safetyScore: 80, employeeCode: "EMP-004", joiningDate: new Date("2022-01-15"), experience: 4 },
    ];

    const driverMap = {};
    for (const d of driversData) {
        const driver = await prisma.driver.create({
            data: { ...d, organizationId: org.id }
        });
        driverMap[d.name] = driver;
    }

    // 9. Seed mock trips
    console.log("Seeding mock trips...");
    const tripsData = [
        { tripNumber: "TR001", vehicleId: "VAN-05", driverId: "Alex Johnson", origin: "Depot A", destination: "Warehouse B", plannedDistance: 120, cargoWeight: 800, estimatedFuel: 15, startOdometer: 41880, dispatchTime: new Date("2026-07-10T08:00:00Z"), expectedArrival: new Date("2026-07-10T14:00:00Z"), revenue: 1500, tripType: "OUTBOUND", status: "COMPLETED", notes: "First completed route" },
        { tripNumber: "TR002", vehicleId: "TRUCK-11", driverId: "Ivan Petrov", origin: "Depot A", destination: "Port C", plannedDistance: 340, cargoWeight: 5000, estimatedFuel: 80, startOdometer: 119660, dispatchTime: new Date("2026-07-12T06:00:00Z"), expectedArrival: new Date("2026-07-12T18:00:00Z"), revenue: 4500, tripType: "OUTBOUND", status: "DISPATCHED", notes: "Active run" },
        { tripNumber: "TR003", vehicleId: "BUS-07", driverId: "Priya Sharma", origin: "Hub X", destination: "Store Y", plannedDistance: 80, cargoWeight: 1200, estimatedFuel: 10, startOdometer: 87920, dispatchTime: new Date("2026-07-14T07:00:00Z"), expectedArrival: new Date("2026-07-14T09:00:00Z"), revenue: 1200, tripType: "LOCAL", status: "SCHEDULED", notes: "Scheduled schedule" },
        { tripNumber: "TR004", vehicleId: "VAN-05", driverId: "Alex Johnson", origin: "Depot B", destination: "Airport Z", plannedDistance: 200, cargoWeight: 600, estimatedFuel: 25, startOdometer: 42000, dispatchTime: new Date("2026-07-09T09:00:00Z"), expectedArrival: new Date("2026-07-09T11:00:00Z"), revenue: 0, tripType: "OUTBOUND", status: "CANCELLED", notes: "Client cancelled cargo" },
        { tripNumber: "TR005", vehicleId: "BUS-07", driverId: "Suresh Kumar", origin: "Hub X", destination: "Depot A", plannedDistance: 95, cargoWeight: 900, estimatedFuel: 12, startOdometer: 87825, dispatchTime: new Date("2026-07-11T10:00:00Z"), expectedArrival: new Date("2026-07-11T16:00:00Z"), revenue: 1100, tripType: "INBOUND", status: "COMPLETED", notes: "Inbound retrieval" },
        { tripNumber: "TR006", vehicleId: "TRUCK-11", driverId: "Ivan Petrov", origin: "Port C", destination: "Warehouse B", plannedDistance: 280, cargoWeight: 4200, estimatedFuel: 65, startOdometer: 120000, dispatchTime: new Date("2026-07-13T12:00:00Z"), expectedArrival: new Date("2026-07-13T20:00:00Z"), revenue: 3800, tripType: "OUTBOUND", status: "DISPATCHED", notes: "Post return route" },
    ];

    const tripMap = {};
    for (const t of tripsData) {
        const trip = await prisma.trip.create({
            data: {
                tripNumber: t.tripNumber,
                origin: t.origin,
                destination: t.destination,
                plannedDistance: t.plannedDistance,
                cargoWeight: t.cargoWeight,
                estimatedFuel: t.estimatedFuel,
                startOdometer: t.startOdometer,
                dispatchTime: t.dispatchTime,
                expectedArrival: t.expectedArrival,
                revenue: t.revenue,
                tripType: t.tripType,
                status: t.status,
                notes: t.notes,
                organizationId: org.id,
                vehicleId: vehicleMap[t.vehicleId].id,
                driverId: driverMap[t.driverId].id,
            }
        });
        tripMap[t.tripNumber] = trip;
    }

    // 10. Seed mock fuel logs
    console.log("Seeding mock fuel logs...");
    const fuelData = [
        { vehicleId: "VAN-05", fuelQuantity: 80, pricePerLiter: 1.60, odometerReading: 42000, date: new Date("2026-07-10T12:00:00Z"), fuelType: "DIESEL" },
        { vehicleId: "TRUCK-11", fuelQuantity: 200, pricePerLiter: 1.60, odometerReading: 120000, date: new Date("2026-07-11T14:00:00Z"), fuelType: "DIESEL" },
        { vehicleId: "BUS-07", fuelQuantity: 120, pricePerLiter: 1.60, odometerReading: 88000, date: new Date("2026-07-09T10:00:00Z"), fuelType: "UNLEADED" },
        { vehicleId: "MINI-03", fuelQuantity: 60, pricePerLiter: 1.60, odometerReading: 31000, date: new Date("2026-07-01T09:00:00Z"), fuelType: "UNLEADED" },
    ];

    for (const f of fuelData) {
        await prisma.fuelLog.create({
            data: {
                fuelQuantity: f.fuelQuantity,
                pricePerLiter: f.pricePerLiter,
                totalCost: f.fuelQuantity * f.pricePerLiter,
                odometerReading: f.odometerReading,
                fuelType: f.fuelType,
                date: f.date,
                createdAt: f.date,
                organizationId: org.id,
                vehicleId: vehicleMap[f.vehicleId].id,
            }
        });
    }

    // 11. Seed other expenses
    console.log("Seeding other expenses...");
    const expensesData = [
        { category: "TOLL", amount: 45.00, isApproved: true, description: "Bridge toll fee", tripId: "TR001", vehicleId: "VAN-05", paymentMethod: "CASH" },
        { category: "MISCELLANEOUS", amount: 20.00, isApproved: true, description: "Driver hydration rest stops", tripId: "TR001", vehicleId: "VAN-05", paymentMethod: "CASH" },
        { category: "TOLL", amount: 120.00, isApproved: false, description: "Highway toll tags", tripId: "TR002", vehicleId: "TRUCK-11", paymentMethod: "CASH" },
        { category: "MISCELLANEOUS", amount: 50.00, isApproved: false, description: "Cargo strapping kits", tripId: "TR002", vehicleId: "TRUCK-11", paymentMethod: "CASH" },
        { category: "TOLL", amount: 30.00, isApproved: true, description: "Express gate fee", tripId: "TR005", vehicleId: "BUS-07", paymentMethod: "CASH" },
        { category: "MISCELLANEOUS", amount: 15.00, isApproved: true, description: "Document printing charges", tripId: "TR005", vehicleId: "BUS-07", paymentMethod: "CASH" },
    ];

    for (const e of expensesData) {
        await prisma.expense.create({
            data: {
                category: e.category,
                amount: e.amount,
                description: e.description,
                paymentMethod: e.paymentMethod,
                approvedById: e.isApproved ? adminUserId : null,
                date: new Date(),
                organizationId: org.id,
                vehicleId: vehicleMap[e.vehicleId].id,
                tripId: tripMap[e.tripId].id,
            }
        });
    }

    // 12. Seed maintenance logs
    console.log("Seeding maintenance logs...");
    const maintenanceData = [
        { serviceType: "Engine Overhaul", description: "Complete engine cleanup and cylinder ring replacements", vendor: "Bob's Auto", priority: "HIGH", cost: 3200, startDate: new Date("2026-07-05"), status: "IN_PROGRESS", vehicleId: "MINI-03" },
        { serviceType: "Oil Change", description: "Regular oil filter replacement and level check", vendor: "QuickLube", priority: "LOW", cost: 120, startDate: new Date("2026-06-20"), status: "COMPLETED", completionDate: new Date("2026-06-20"), vehicleId: "VAN-05" },
        { serviceType: "Brake Replacement", description: "Replace front and rear pads", vendor: "Midas", priority: "MEDIUM", cost: 850, startDate: new Date("2026-06-15"), status: "COMPLETED", completionDate: new Date("2026-06-15"), vehicleId: "TRUCK-11" },
        { serviceType: "Transmission Repair", description: "Gearbox clutch replacement", vendor: "TransMasters", priority: "CRITICAL", cost: 2100, startDate: new Date("2026-05-10"), status: "COMPLETED", completionDate: new Date("2026-05-10"), vehicleId: "PICKUP-02" },
    ];

    for (const m of maintenanceData) {
        const record = await prisma.maintenance.create({
            data: {
                serviceType: m.serviceType,
                description: m.description,
                vendor: m.vendor,
                priority: m.priority,
                cost: m.cost,
                startDate: m.startDate,
                completionDate: m.completionDate,
                status: m.status,
                organizationId: org.id,
                vehicleId: vehicleMap[m.vehicleId].id,
            }
        });

        // Seed corresponding maintenance expenses
        await prisma.expense.create({
            data: {
                category: "SERVICE",
                amount: m.cost,
                description: `Maintenance: ${m.serviceType}`,
                paymentMethod: "BANK_TRANSFER",
                approvedById: m.status === "COMPLETED" ? adminUserId : null,
                date: new Date(),
                organizationId: org.id,
                vehicleId: vehicleMap[m.vehicleId].id,
            }
        });
    }

    console.log("✅ Seeding completed successfully!");
}

main()
    .catch((e) => {
        console.error("❌ Seeding failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
