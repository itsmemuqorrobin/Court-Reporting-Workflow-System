import type { Job, Reporter } from "@prisma/client";

export function chooseBestReporter(job: Job, reporters: Reporter[]) {
  const availableReporters = reporters.filter(
    (reporter) => reporter.isAvailable,
  );

  if (availableReporters.length === 0) {
    return null;
  }

  if (job.locationType === "PHYSICAL" && job.city) {
    const sameCityReporter = availableReporters.find(
      (reporter) => reporter.city.toLowerCase() === job.city?.toLowerCase(),
    );

    if (sameCityReporter) {
      return sameCityReporter;
    }
  }

  return availableReporters[0];
}
