import { handleApiError, successResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const editors = await prisma.editor.findMany({
      orderBy: [
        {
          isAvailable: "desc",
        },
        {
          name: "asc",
        },
      ],
    });

    return successResponse(editors);
  } catch (error) {
    return handleApiError(error);
  }
}
