"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type JobStatus = "NEW" | "ASSIGNED" | "TRANSCRIBED" | "REVIEWED" | "COMPLETED";

type JobLocationType = "PHYSICAL" | "REMOTE";

type ReviewStatus = "NOT_STARTED" | "IN_REVIEW" | "APPROVED";

type Reporter = {
  id: string;
  name: string;
  city: string;
  isAvailable: boolean;
  ratePerMinute: number;
};

type Editor = {
  id: string;
  name: string;
  isAvailable: boolean;
  flatFee: number;
};

type Job = {
  id: string;
  caseName: string;
  durationMinutes: number;
  locationType: JobLocationType;
  city: string | null;
  status: JobStatus;
  reviewStatus: ReviewStatus;
  reporter: Reporter | null;
  editor: Editor | null;
  payment: {
    reporterPayout: number;
    editorPayout: number;
    totalPayout: number;
  };
};

type Message = {
  type: "success" | "error";
  text: string;
};

const statusOrder: JobStatus[] = [
  "NEW",
  "ASSIGNED",
  "TRANSCRIBED",
  "REVIEWED",
  "COMPLETED",
];

const statusLabel: Record<JobStatus, string> = {
  NEW: "New",
  ASSIGNED: "Assigned",
  TRANSCRIBED: "Transcribed",
  REVIEWED: "Reviewed",
  COMPLETED: "Completed",
};

const statusStyles: Record<JobStatus, string> = {
  NEW: "border-slate-700 bg-slate-800 text-slate-200",
  ASSIGNED: "border-blue-700 bg-blue-950 text-blue-200",
  TRANSCRIBED: "border-amber-700 bg-amber-950 text-amber-200",
  REVIEWED: "border-purple-700 bg-purple-950 text-purple-200",
  COMPLETED: "border-emerald-700 bg-emerald-950 text-emerald-200",
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatIDR(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Request failed");
  }

  return data;
}

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      {statusLabel[status]}
    </span>
  );
}

function WorkflowProgress({ status }: { status: JobStatus }) {
  const activeIndex = statusOrder.indexOf(status);

  return (
    <div className="max-w-full overflow-x-auto pb-1">
      <div className="grid min-w-[520px] grid-cols-5 gap-2">
        {statusOrder.map((item, index) => {
          const isDone = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <div key={item} className="space-y-2">
              <div
                className={cn(
                  "h-2 rounded-full",
                  isDone && "bg-emerald-500",
                  isActive && "bg-cyan-400",
                  !isDone && !isActive && "bg-slate-800",
                )}
              />
              <p
                className={cn(
                  "text-[11px] font-medium",
                  isActive ? "text-cyan-300" : "text-slate-500",
                  isDone && "text-emerald-300",
                )}
              >
                {statusLabel[item]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WorkflowLegend() {
  return (
    <div className="mt-6 grid gap-2 sm:grid-cols-5">
      {statusOrder.map((status, index) => (
        <div
          key={status}
          className="rounded-2xl border border-white/10 bg-slate-950/40 p-3"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Step {index + 1}
          </p>
          <p className="mt-1 text-sm font-bold text-slate-100">
            {statusLabel[status]}
          </p>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-10 text-center">
      <p className="text-lg font-semibold text-slate-200">No jobs found</p>
      <p className="mt-2 text-sm text-slate-500">
        Create a new transcription job or adjust your search/filter.
      </p>
    </div>
  );
}

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [caseName, setCaseName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [locationType, setLocationType] = useState<JobLocationType>("PHYSICAL");
  const [city, setCity] = useState("Jakarta");
  const [statusFilter, setStatusFilter] = useState<JobStatus | "ALL">("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesStatus =
        statusFilter === "ALL" ? true : job.status === statusFilter;

      const keyword = searchKeyword.trim().toLowerCase();

      const matchesKeyword =
        keyword.length === 0 ||
        job.caseName.toLowerCase().includes(keyword) ||
        job.city?.toLowerCase().includes(keyword) ||
        job.reporter?.name.toLowerCase().includes(keyword) ||
        job.editor?.name.toLowerCase().includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [jobs, searchKeyword, statusFilter]);

  const totalPayout = useMemo(() => {
    return jobs.reduce((total, job) => total + job.payment.totalPayout, 0);
  }, [jobs]);

  const completedJobs = useMemo(() => {
    return jobs.filter((job) => job.status === "COMPLETED").length;
  }, [jobs]);

  const inProgressJobs = useMemo(() => {
    return jobs.filter(
      (job) => job.status !== "NEW" && job.status !== "COMPLETED",
    ).length;
  }, [jobs]);

  async function loadJobs() {
    try {
      setIsLoading(true);
      const data = await fetchJson<Job[]>("/api/jobs");
      setJobs(data);
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to load jobs",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  async function handleCreateJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setMessage(null);

      await fetchJson<Job>("/api/jobs", {
        method: "POST",
        body: JSON.stringify({
          caseName,
          durationMinutes,
          locationType,
          city: locationType === "PHYSICAL" ? city : null,
        }),
      });

      setCaseName("");
      setDurationMinutes(30);
      setLocationType("PHYSICAL");
      setCity("Jakarta");

      setMessage({
        type: "success",
        text: "Job created successfully.",
      });

      await loadJobs();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to create job",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function runJobAction(
    jobId: string,
    action: () => Promise<unknown>,
    successText: string,
  ) {
    try {
      setActiveJobId(jobId);
      setMessage(null);

      await action();
      await loadJobs();

      setMessage({
        type: "success",
        text: successText,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Action failed",
      });
    } finally {
      setActiveJobId(null);
    }
  }

  function assignReporter(jobId: string) {
    return runJobAction(
      jobId,
      () =>
        fetchJson<Job>(`/api/jobs/${jobId}/assign-reporter`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      "Reporter assigned successfully.",
    );
  }

  function assignEditor(jobId: string) {
    return runJobAction(
      jobId,
      () =>
        fetchJson<Job>(`/api/jobs/${jobId}/assign-editor`, {
          method: "POST",
          body: JSON.stringify({}),
        }),
      "Editor assigned successfully.",
    );
  }

  function updateStatus(jobId: string, status: JobStatus) {
    return runJobAction(
      jobId,
      () =>
        fetchJson<Job>(`/api/jobs/${jobId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        }),
      `Job moved to ${statusLabel[status]}.`,
    );
  }

  function renderPrimaryAction(job: Job) {
    const isBusy = activeJobId === job.id;

    if (job.status === "NEW") {
      return (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => assignReporter(job.id)}
          className="whitespace-nowrap rounded-xl bg-cyan-400 px-3 py-2 text-[11px] font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Assigning..." : "Assign Reporter"}
        </button>
      );
    }

    if (job.status === "ASSIGNED") {
      return (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => updateStatus(job.id, "TRANSCRIBED")}
          className="whitespace-nowrap rounded-xl bg-amber-400 px-3 py-2 text-[11px] font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Updating..." : "Mark Transcribed"}
        </button>
      );
    }

    if (job.status === "TRANSCRIBED" && !job.editor) {
      return (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => assignEditor(job.id)}
          className="whitespace-nowrap rounded-xl bg-purple-400 px-3 py-2 text-[11px] font-bold text-slate-950 transition hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Assigning..." : "Assign Editor"}
        </button>
      );
    }

    if (job.status === "TRANSCRIBED" && job.editor) {
      return (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => updateStatus(job.id, "REVIEWED")}
          className="whitespace-nowrap rounded-xl bg-purple-400 px-3 py-2 text-[11px] font-bold text-slate-950 transition hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Updating..." : "Mark Reviewed"}
        </button>
      );
    }

    if (job.status === "REVIEWED") {
      return (
        <button
          type="button"
          disabled={isBusy}
          onClick={() => updateStatus(job.id, "COMPLETED")}
          className="whitespace-nowrap rounded-xl bg-emerald-400 px-3 py-2 text-[11px] font-bold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isBusy ? "Updating..." : "Complete Job"}
        </button>
      );
    }

    return (
      <span className="whitespace-nowrap rounded-xl border border-emerald-800 bg-emerald-950 px-3 py-2 text-[11px] font-semibold text-emerald-200">
        Completed
      </span>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,#164e63,transparent_36%),linear-gradient(180deg,#020617,#0f172a)] px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <header className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/30 backdrop-blur">
          <div className="grid min-w-0 gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] lg:p-8">
            <div className="min-w-0">
              <div className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                AutoScript Fullstack Assessment
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                Court Reporting Workflow Manager
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
                Create transcription jobs, assign reporters and editors, track
                workflow progress, and calculate total payouts in one dashboard.
              </p>

              <WorkflowLegend />
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-3xl font-black text-white">{jobs.length}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Total Jobs
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-3xl font-black text-cyan-300">
                  {inProgressJobs}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  In Progress
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                <p className="text-3xl font-black text-emerald-300">
                  {completedJobs}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Completed
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4">
                <p className="break-words text-lg font-black text-white">
                  {formatIDR(totalPayout)}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  Total Payout
                </p>
              </div>
            </div>
          </div>
        </header>

        {message ? (
          <div
            className={cn(
              "rounded-2xl border px-4 py-3 text-sm font-medium",
              message.type === "success" &&
                "border-emerald-700 bg-emerald-950 text-emerald-100",
              message.type === "error" &&
                "border-red-700 bg-red-950 text-red-100",
            )}
          >
            {message.text}
          </div>
        ) : null}

        <section className="grid min-w-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[2rem] border border-white/10 bg-slate-900/90 p-5 shadow-xl shadow-black/20 xl:sticky xl:top-6">
            <div>
              <p className="text-sm font-semibold text-cyan-300">
                New Workflow
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">Create Job</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Start with the recording information. Physical jobs require a
                city so the system can prefer a same-city reporter.
              </p>
            </div>

            <form onSubmit={handleCreateJob} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Case Name
                </span>
                <input
                  value={caseName}
                  onChange={(event) => setCaseName(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                  placeholder="e.g. State vs Andika"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Duration
                </span>
                <div className="mt-2 flex overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 focus-within:border-cyan-400">
                  <input
                    value={durationMinutes}
                    onChange={(event) =>
                      setDurationMinutes(Number(event.target.value))
                    }
                    type="number"
                    min={1}
                    className="w-full min-w-0 bg-transparent px-4 py-3 text-sm text-white outline-none"
                    required
                  />
                  <span className="shrink-0 border-l border-slate-700 px-4 py-3 text-sm text-slate-400">
                    minutes
                  </span>
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-300">
                  Location Type
                </span>
                <select
                  value={locationType}
                  onChange={(event) =>
                    setLocationType(event.target.value as JobLocationType)
                  }
                  className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                >
                  <option value="PHYSICAL">Physical Court</option>
                  <option value="REMOTE">Remote Recording</option>
                </select>
              </label>

              {locationType === "PHYSICAL" ? (
                <label className="block">
                  <span className="text-sm font-medium text-slate-300">
                    City
                  </span>
                  <input
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                    placeholder="Jakarta"
                    required
                  />
                </label>
              ) : null}

              <button
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating Job..." : "Create Job"}
              </button>
            </form>
          </aside>

          <section className="min-w-0 rounded-[2rem] border border-white/10 bg-slate-900/90 p-4 shadow-xl shadow-black/20 sm:p-5">
            <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-cyan-300">
                  Operations Dashboard
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">
                  Job Queue
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Follow the intended workflow: assign reporter → transcribe →
                  assign editor → review → complete.
                </p>
              </div>

              <button
                type="button"
                onClick={loadJobs}
                className="w-full rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 sm:w-auto"
              >
                Refresh Data
              </button>
            </div>

            <div className="mt-6 grid min-w-0 gap-3 md:grid-cols-[minmax(0,1fr)_180px] xl:grid-cols-[minmax(0,1fr)_200px]">
              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
                placeholder="Search by case, city, reporter, or editor..."
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as JobStatus | "ALL")
                }
                className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="ALL">All Statuses</option>
                {statusOrder.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 min-w-0">
              {isLoading ? (
                <div className="rounded-3xl border border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-400">
                  Loading jobs...
                </div>
              ) : filteredJobs.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <div className="grid gap-4 xl:hidden">
                    {filteredJobs.map((job) => (
                      <article
                        key={job.id}
                        className="min-w-0 rounded-3xl border border-slate-800 bg-slate-950 p-4"
                      >
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="break-words font-bold text-white">
                              {job.caseName}
                            </h3>
                            <p className="mt-1 text-xs text-slate-500">
                              {job.durationMinutes} minutes ·{" "}
                              {job.locationType === "PHYSICAL"
                                ? job.city
                                : "Remote"}
                            </p>
                          </div>

                          <div className="shrink-0">
                            <StatusBadge status={job.status} />
                          </div>
                        </div>

                        <div className="mt-5">
                          <WorkflowProgress status={job.status} />
                        </div>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-900 p-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Reporter
                            </p>
                            <p className="mt-1 break-words text-sm text-slate-200">
                              {job.reporter?.name ?? "Unassigned"}
                            </p>
                            {job.reporter ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {job.reporter.city} ·{" "}
                                {formatIDR(job.reporter.ratePerMinute)}/min
                              </p>
                            ) : null}
                          </div>

                          <div className="rounded-2xl bg-slate-900 p-3">
                            <p className="text-xs font-semibold uppercase text-slate-500">
                              Editor
                            </p>
                            <p className="mt-1 break-words text-sm text-slate-200">
                              {job.editor?.name ?? "Unassigned"}
                            </p>
                            {job.editor ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {formatIDR(job.editor.flatFee)} flat fee
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-semibold uppercase text-slate-500">
                              Total Payout
                            </span>
                            <span className="text-right font-black text-white">
                              {formatIDR(job.payment.totalPayout)}
                            </span>
                          </div>

                          <div className="mt-2 grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                            <span>
                              Reporter: {formatIDR(job.payment.reporterPayout)}
                            </span>
                            <span>
                              Editor: {formatIDR(job.payment.editorPayout)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-end">
                          {renderPrimaryAction(job)}
                        </div>
                      </article>
                    ))}
                  </div>

                  <div className="hidden min-w-0 overflow-x-auto xl:block">
                    <table className="w-full min-w-[980px] table-fixed border-separate border-spacing-y-3 text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="w-[20%] px-4">Case</th>
                          <th className="w-[28%] px-4">Workflow</th>
                          <th className="w-[16%] px-4">Reporter</th>
                          <th className="w-[14%] px-4">Editor</th>
                          <th className="w-[14%] px-4">Payment</th>
                          <th className="w-[8%] px-4 text-right">Action</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredJobs.map((job) => (
                          <tr key={job.id} className="bg-slate-950">
                            <td className="rounded-l-3xl px-4 py-5 align-top">
                              <p className="break-words font-bold text-white">
                                {job.caseName}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {job.durationMinutes} minutes
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {job.locationType === "PHYSICAL"
                                  ? `Physical · ${job.city}`
                                  : "Remote"}
                              </p>
                            </td>

                            <td className="px-4 py-5 align-top">
                              <StatusBadge status={job.status} />
                              <p className="mt-2 text-xs text-slate-500">
                                Review: {job.reviewStatus}
                              </p>
                              <div className="mt-4 max-w-[340px]">
                                <WorkflowProgress status={job.status} />
                              </div>
                            </td>

                            <td className="px-4 py-5 align-top">
                              {job.reporter ? (
                                <>
                                  <p className="break-words font-medium text-slate-100">
                                    {job.reporter.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {job.reporter.city}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatIDR(job.reporter.ratePerMinute)}/min
                                  </p>
                                </>
                              ) : (
                                <span className="text-slate-500">
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-5 align-top">
                              {job.editor ? (
                                <>
                                  <p className="break-words font-medium text-slate-100">
                                    {job.editor.name}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {formatIDR(job.editor.flatFee)} flat fee
                                  </p>
                                </>
                              ) : (
                                <span className="text-slate-500">
                                  Unassigned
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-5 align-top">
                              <p className="break-words font-black text-white">
                                {formatIDR(job.payment.totalPayout)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Reporter:{" "}
                                {formatIDR(job.payment.reporterPayout)}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                Editor: {formatIDR(job.payment.editorPayout)}
                              </p>
                            </td>

                            <td className="rounded-r-3xl px-4 py-5 text-right align-top">
                              {renderPrimaryAction(job)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
