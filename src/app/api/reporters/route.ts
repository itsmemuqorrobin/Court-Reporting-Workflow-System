import { handleApiError, successResponse } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const reporters = await prisma.reporter.findMany({
      orderBy: [
        {
          isAvailable: "desc",
        },
        {
          city: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

    return successResponse(reporters);
  } catch (error) {
    return handleApiError(error);
  }
}
