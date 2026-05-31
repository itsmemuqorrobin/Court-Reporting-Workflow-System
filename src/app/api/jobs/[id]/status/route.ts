import { ReviewStatus } from "@prisma/client";
import { errorResponse, handleApiError, successResponse } from "@/lib/http";
import { serializeJob } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { updateStatusSchema } from "@/lib/schemas";
import { canTransitionStatus } from "@/lib/workflow";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = await request.json();
    const payload = updateStatusSchema.parse(body);

    const currentJob = await prisma.job.findUnique({
      where: { id },
      include: {
        reporter: true,
        editor: true,
      },
    });

    if (!currentJob) {
      return errorResponse("Job not found", 404);
    }

    if (!canTransitionStatus(currentJob.status, payload.status)) {
      return errorResponse(
        `Invalid status transition from ${currentJob.status} to ${payload.status}`,
        400,
      );
    }

    if (payload.status === "TRANSCRIBED" && !currentJob.reporterId) {
      return errorResponse(
        "Reporter must be assigned before transcription",
        400,
      );
    }

    if (payload.status === "REVIEWED" && !currentJob.editorId) {
      return errorResponse("Editor must be assigned before review", 400);
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        status: payload.status,
        reviewStatus:
          payload.status === "REVIEWED"
            ? ReviewStatus.APPROVED
            : currentJob.reviewStatus,
      },
      include: {
        reporter: true,
        editor: true,
      },
    });

    return successResponse(serializeJob(job));
  } catch (error) {
    return handleApiError(error);
  }
}
