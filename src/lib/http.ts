import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    {
      error: message,
    },
    { status },
  );
}

export function handleApiError(error: unknown) {
  console.error(error);

  if (error instanceof ZodError) {
    const message = error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join(", ");

    return errorResponse(message, 400);
  }

  if (error instanceof Error) {
    return errorResponse(error.message, 400);
  }

  return errorResponse("Something went wrong", 500);
}
