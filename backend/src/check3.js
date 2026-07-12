import prisma from "./config/prisma.js";
import { encrypt } from "./utils/crypto.js";

async function check() {
    const orgId = "716267aa-1347-4a39-932c-d6cba100c5af";
    const enc = encrypt("rt-yu-8");
    const dupLic = await prisma.driver.findFirst({ where: { licenseNumber: enc } });
    console.log("dupLic encrypted:", dupLic?.id, dupLic?.name);
}

check();
