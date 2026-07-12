import prisma from "./config/prisma.js";

async function check() {
    const orgId = "716267aa-1347-4a39-932c-d6cba100c5af"; // from previous check
    const dupEmp = await prisma.driver.findFirst({ where: { employeeCode: "EMP-62319" } });
    const dupEmail = await prisma.driver.findFirst({ where: { email: "24bce233@nirmauni.ac.in" } }); // from screenshot
    // license from screenshot: "rt-yu-8"
    // phone from screenshot: "7412589632"
    
    console.log("dupEmp:", dupEmp?.id, dupEmp?.name);
    console.log("dupEmail:", dupEmail?.id, dupEmail?.name);
    
    // Also log all drivers to see
    const all = await prisma.driver.findMany();
    console.log("Total drivers:", all.length);
}

check();
