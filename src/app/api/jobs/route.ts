import { prisma } from "@/lib/prisma";
import { createJobSchema } from "@/lib/schemas";
import { handleApiError, successResponse } from "@/lib/http";
import { serializeJob } from "@/lib/payment";

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

    return successResponse(jobs.map(serializeJob));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = createJobSchema.parse(body);

    const job = await prisma.job.create({
      data: {
        caseName: payload.caseName,
        durationMinutes: payload.durationMinutes,
        locationType: payload.locationType,
        city: payload.locationType === "PHYSICAL" ? payload.city : null,
      },
      include: {
        reporter: true,
        editor: true,
      },
    });

    return successResponse(serializeJob(job), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
