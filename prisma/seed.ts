import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.job.deleteMany();
  await prisma.reporter.deleteMany();
  await prisma.editor.deleteMany();

  await prisma.reporter.createMany({
    data: [
      {
        name: "Ayu Pratama",
        city: "Jakarta",
        isAvailable: true,
        ratePerMinute: 2000,
      },
      {
        name: "Bima Santoso",
        city: "Jakarta",
        isAvailable: true,
        ratePerMinute: 2200,
      },
      {
        name: "Citra Lestari",
        city: "Bandung",
        isAvailable: true,
        ratePerMinute: 2000,
      },
      {
        name: "Dimas Nugroho",
        city: "Surabaya",
        isAvailable: true,
        ratePerMinute: 2100,
      },
    ],
  });

  await prisma.editor.createMany({
    data: [
      {
        name: "Editor One",
        isAvailable: true,
        flatFee: 50000,
      },
      {
        name: "Editor Two",
        isAvailable: true,
        flatFee: 60000,
      },
      {
        name: "Editor Three",
        isAvailable: true,
        flatFee: 55000,
      },
    ],
  });

  await prisma.job.createMany({
    data: [
      {
        caseName: "State vs Andika",
        durationMinutes: 45,
        locationType: "PHYSICAL",
        city: "Jakarta",
        status: "NEW",
      },
      {
        caseName: "Civil Hearing - PT Maju",
        durationMinutes: 70,
        locationType: "REMOTE",
        city: null,
        status: "NEW",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
