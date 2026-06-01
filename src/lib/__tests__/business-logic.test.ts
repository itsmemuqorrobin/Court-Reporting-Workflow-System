import { describe, expect, it } from "vitest";
import type { Editor, Job, Reporter } from "@prisma/client";

import { calculateJobPayment } from "../payment";
import { canTransitionStatus } from "../workflow";
import { chooseBestReporter } from "../assigment";

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const updatedAt = new Date("2026-01-01T00:00:00.000Z");

function createMockReporter(overrides: Partial<Reporter> = {}): Reporter {
  return {
    id: "reporter-1",
    name: "Ayu Pratama",
    city: "Jakarta",
    isAvailable: true,
    ratePerMinute: 2000,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

function createMockEditor(overrides: Partial<Editor> = {}): Editor {
  return {
    id: "editor-1",
    name: "Editor One",
    isAvailable: true,
    flatFee: 50000,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
    caseName: "State vs Andika",
    durationMinutes: 60,
    locationType: "PHYSICAL",
    city: "Jakarta",
    status: "NEW",
    reviewStatus: "NOT_STARTED",
    reporterId: null,
    editorId: null,
    createdAt,
    updatedAt,
    ...overrides,
  };
}

describe("workflow status transition", () => {
  it("allows valid workflow transitions", () => {
    expect(canTransitionStatus("NEW", "ASSIGNED")).toBe(true);
    expect(canTransitionStatus("ASSIGNED", "TRANSCRIBED")).toBe(true);
    expect(canTransitionStatus("TRANSCRIBED", "REVIEWED")).toBe(true);
    expect(canTransitionStatus("REVIEWED", "COMPLETED")).toBe(true);
  });

  it("rejects invalid workflow transitions", () => {
    expect(canTransitionStatus("NEW", "COMPLETED")).toBe(false);
    expect(canTransitionStatus("ASSIGNED", "REVIEWED")).toBe(false);
    expect(canTransitionStatus("COMPLETED", "NEW")).toBe(false);
  });
});

describe("reporter assignment recommendation", () => {
  it("prefers same-city reporter for physical jobs", () => {
    const job = createMockJob({
      locationType: "PHYSICAL",
      city: "Jakarta",
    });

    const reporters = [
      createMockReporter({
        id: "reporter-bandung",
        name: "Citra Lestari",
        city: "Bandung",
      }),
      createMockReporter({
        id: "reporter-jakarta",
        name: "Ayu Pratama",
        city: "Jakarta",
      }),
    ];

    const result = chooseBestReporter(job, reporters);

    expect(result?.id).toBe("reporter-jakarta");
  });

  it("allows any available reporter for remote jobs", () => {
    const job = createMockJob({
      locationType: "REMOTE",
      city: null,
    });

    const reporters = [
      createMockReporter({
        id: "reporter-surabaya",
        name: "Dimas Nugroho",
        city: "Surabaya",
      }),
    ];

    const result = chooseBestReporter(job, reporters);

    expect(result?.id).toBe("reporter-surabaya");
  });

  it("ignores unavailable reporters", () => {
    const job = createMockJob({
      locationType: "PHYSICAL",
      city: "Jakarta",
    });

    const reporters = [
      createMockReporter({
        id: "reporter-unavailable",
        name: "Unavailable Reporter",
        city: "Jakarta",
        isAvailable: false,
      }),
      createMockReporter({
        id: "reporter-available",
        name: "Available Reporter",
        city: "Bandung",
        isAvailable: true,
      }),
    ];

    const result = chooseBestReporter(job, reporters);

    expect(result?.id).toBe("reporter-available");
  });
});

describe("payment calculation", () => {
  it("calculates reporter payout, editor payout, and total payout", () => {
    const job = {
      ...createMockJob({
        durationMinutes: 60,
      }),
      reporter: createMockReporter({
        ratePerMinute: 2000,
      }),
      editor: createMockEditor({
        flatFee: 50000,
      }),
    };

    const payment = calculateJobPayment(job);

    expect(payment.reporterPayout).toBe(120000);
    expect(payment.editorPayout).toBe(50000);
    expect(payment.totalPayout).toBe(170000);
  });

  it("returns zero payout for missing assignments", () => {
    const job = {
      ...createMockJob({
        durationMinutes: 60,
      }),
      reporter: null,
      editor: null,
    };

    const payment = calculateJobPayment(job);

    expect(payment.reporterPayout).toBe(0);
    expect(payment.editorPayout).toBe(0);
    expect(payment.totalPayout).toBe(0);
  });
});
