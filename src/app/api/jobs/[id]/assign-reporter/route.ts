import { JobStatus } from "@prisma/client";

import { errorResponse, handleApiError, successResponse } from "@/lib/http";
import { serializeJob } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { assignReporterSchema } from "@/lib/schemas";
import { chooseBestReporter } from "@/lib/assigment";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const payload = assignReporterSchema.parse(body);

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return errorResponse("Job not found", 404);
    }

    if (job.status !== "NEW") {
      return errorResponse("Reporter can only be assigned to NEW jobs", 400);
    }

    let reporter = null;

    if (payload.reporterId) {
      reporter = await prisma.reporter.findUnique({
        where: {
          id: payload.reporterId,
        },
      });

      if (!reporter) {
        return errorResponse("Reporter not found", 404);
      }

      if (!reporter.isAvailable) {
        return errorResponse("Reporter is not available", 400);
      }
    } else {
      const reporters = await prisma.reporter.findMany({
        where: {
          isAvailable: true,
        },
      });

      reporter = chooseBestReporter(job, reporters);
    }

    if (!reporter) {
      return errorResponse("No available reporter found", 400);
    }

    const updatedJob = await prisma.$transaction(async (tx) => {
      await tx.reporter.update({
        where: {
          id: reporter.id,
        },
        data: {
          isAvailable: false,
        },
      });

      return tx.job.update({
        where: {
          id,
        },
        data: {
          reporterId: reporter.id,
          status: JobStatus.ASSIGNED,
        },
        include: {
          reporter: true,
          editor: true,
        },
      });
    });

    return successResponse(serializeJob(updatedJob));
  } catch (error) {
    return handleApiError(error);
  }
}
