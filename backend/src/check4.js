import prisma from "./config/prisma.js";

async function check() {
    const d = await prisma.driver.findFirst({ where: { name: "fsjdflgs" } });
    console.log("phone:", d?.phone, "typeof:", typeof d?.phone);
}
check();
