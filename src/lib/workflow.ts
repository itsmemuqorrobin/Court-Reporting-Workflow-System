import { JobStatus } from "@prisma/client";

const allowedTransitions: Record<JobStatus, JobStatus[]> = {
  NEW: ["ASSIGNED"],
  ASSIGNED: ["TRANSCRIBED"],
  TRANSCRIBED: ["REVIEWED"],
  REVIEWED: ["COMPLETED"],
  COMPLETED: [],
};

export function canTransitionStatus(
  currentStatus: JobStatus,
  nextStatus: JobStatus,
) {
  return allowedTransitions[currentStatus].includes(nextStatus);
}
