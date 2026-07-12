import prisma from "./config/prisma.js";
import { decrypt } from "./utils/crypto.js";

async function check() {
    const driver = await prisma.driver.findUnique({ where: { id: "fe256637-b110-49d4-ba10-b66ba65601b2" } });
    console.log(driver);
    console.log("Decrypted License:", decrypt(driver.licenseNumber));
}

check();
