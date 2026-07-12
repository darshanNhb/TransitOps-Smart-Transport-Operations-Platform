import cronService from "./services/cron.service.js";

async function runTest() {
    console.log("Triggering checkLicenseExpiries manually...");
    await cronService.checkLicenseExpiries();
    console.log("Done.");
    process.exit(0);
}

runTest();
