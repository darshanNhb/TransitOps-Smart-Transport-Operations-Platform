import prisma from "./config/prisma.js";

async function mockExpiry() {
    const targetDateStart = new Date();
    targetDateStart.setDate(targetDateStart.getDate() + 7);
    // Add 12 hours so it's safely in the middle of the day
    targetDateStart.setHours(12, 0, 0, 0);

    const driver = await prisma.driver.findFirst();
    if (driver) {
        await prisma.driver.update({
            where: { id: driver.id },
            data: { licenseExpiry: targetDateStart }
        });
        console.log(`Updated driver ${driver.name}'s license expiry to ${targetDateStart}`);
    }
}

mockExpiry();
