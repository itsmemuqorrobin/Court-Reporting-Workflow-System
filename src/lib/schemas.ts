import { JobLocationType, JobStatus } from "@prisma/client";
import { z } from "zod";

export const createJobSchema = z
  .object({
    caseName: z.string().min(2, "Case name is required"),
    durationMinutes: z.coerce
      .number()
      .int()
      .positive("Duration must be greater than 0"),
    locationType: z.nativeEnum(JobLocationType),
    city: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.locationType === "PHYSICAL") {
        return Boolean(data.city && data.city.trim().length > 0);
      }

      return true;
    },
    {
      message: "City is required for physical jobs",
      path: ["city"],
    },
  );

export const updateStatusSchema = z.object({
  status: z.nativeEnum(JobStatus),
});

export const assignReporterSchema = z.object({
  reporterId: z.string().optional(),
});

export const assignEditorSchema = z.object({
  editorId: z.string().optional(),
});
