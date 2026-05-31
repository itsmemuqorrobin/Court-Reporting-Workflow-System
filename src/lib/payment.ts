import type { Prisma } from "@prisma/client";

type JobWithAssignments = Prisma.JobGetPayload<{
  include: {
    reporter: true;
    editor: true;
  };
}>;

export function calculateJobPayment(job: JobWithAssignments) {
  const reporterPayout = job.reporter
    ? job.durationMinutes * job.reporter.ratePerMinute
    : 0;

  const editorPayout = job.editor ? job.editor.flatFee : 0;

  return {
    reporterPayout,
    editorPayout,
    totalPayout: reporterPayout + editorPayout,
  };
}

export function serializeJob(job: JobWithAssignments) {
  return {
    ...job,
    payment: calculateJobPayment(job),
  };
}
