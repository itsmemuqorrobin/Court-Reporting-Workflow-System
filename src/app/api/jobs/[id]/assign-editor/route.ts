import { ReviewStatus } from "@prisma/client";
import { errorResponse, handleApiError, successResponse } from "@/lib/http";
import { serializeJob } from "@/lib/payment";
import { prisma } from "@/lib/prisma";
import { assignEditorSchema } from "@/lib/schemas";

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
    const payload = assignEditorSchema.parse(body);

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return errorResponse("Job not found", 404);
    }

    if (job.status !== "TRANSCRIBED") {
      return errorResponse(
        "Editor can only be assigned after transcription",
        400,
      );
    }

    let editor = null;

    if (payload.editorId) {
      editor = await prisma.editor.findUnique({
        where: {
          id: payload.editorId,
        },
      });

      if (!editor) {
        return errorResponse("Editor not found", 404);
      }

      if (!editor.isAvailable) {
        return errorResponse("Editor is not available", 400);
      }
    } else {
      editor = await prisma.editor.findFirst({
        where: {
          isAvailable: true,
        },
      });
    }

    if (!editor) {
      return errorResponse("No available editor found", 400);
    }

    const updatedJob = await prisma.$transaction(async (tx) => {
      await tx.editor.update({
        where: {
          id: editor.id,
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
          editorId: editor.id,
          reviewStatus: ReviewStatus.IN_REVIEW,
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
