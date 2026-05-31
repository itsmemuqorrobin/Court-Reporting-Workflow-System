import { successResponse, handleApiError } from "@/lib/http";
import { calculateJobPayment } from "@/lib/payment";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      include: {
        reporter: true,
        editor: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const perJob = jobs.map((job) => ({
      jobId: job.id,
      caseName: job.caseName,
      ...calculateJobPayment(job),
    }));

    const totalPayout = perJob.reduce(
      (total, job) => total + job.totalPayout,
      0,
    );

    return successResponse({
      totalPayout,
      perJob,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
