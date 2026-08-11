import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkIcon, CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BookmarkFolderPicker } from "@/components/bookmark-folder-picker";
import { rpcClient } from "@/lib/api";
import type { JobDetail, JobSummary, ParsedLog } from "@unqueue/bullmq";
import { cn } from "@/lib/utils";
import {
  onResync,
  onSocketEvent,
  subscribeRooms,
  unsubscribeRooms,
} from "@/lib/socket";
import { Badge } from "@unqueue/ui/components/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { JobStatusChip } from "@/components/job-status-chip";
import { CodeBlock } from "@/components/code-block";
import {
  CodeBlockSkeleton,
  DetailValueSkeleton,
} from "@/components/job-detail-panel-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatDelay,
  formatDuration,
  formatJobTimestamp,
} from "@/lib/format-timestamp";
import { formatJobAttemptsValue } from "@/lib/format-job-attempts";

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    void navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      type="button"
      onClick={copy}
      className="inline-flex shrink-0 items-center justify-center rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={copied ? "Copied" : "Copy job ID"}
    >
      {copied ? (
        <CheckIcon className="size-3 text-emerald-600 dark:text-emerald-400" />
      ) : (
        <CopyIcon className="size-3" />
      )}
    </button>
  );
}

function DetailRow({
  label,
  children,
  mono,
}: {
  label: string;
  children: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 py-px">
      <dt className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">
        {label}
      </dt>
      <dd
        className={cn(
          "min-w-0 text-[11px] leading-tight",
          mono && "font-mono tabular-nums",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

function isJobDetail(job: JobDetail | JobSummary | undefined): job is JobDetail {
  return !!job && "payload" in job && "progress" in job && "logs" in job;
}

function mergeJobUpdate(
  current: JobDetail | JobSummary | null | undefined,
  incoming: JobSummary,
): JobDetail | JobSummary {
  if (!current) return incoming;
  return {
    ...current,
    ...incoming,
    name: incoming.name || current.name,
    timestamp: incoming.timestamp || current.timestamp,
    processedOn: incoming.processedOn ?? current.processedOn,
    finishedOn: incoming.finishedOn ?? current.finishedOn,
    failedReason: incoming.failedReason ?? current.failedReason,
    delay: incoming.delay ?? current.delay,
    priority: incoming.priority ?? current.priority,
    stacktrace: incoming.stacktrace ?? current.stacktrace,
    returnValue: incoming.returnValue ?? current.returnValue,
    opts: incoming.opts ?? current.opts,
  };
}

function mergeProgressUpdate(
  current: JobDetail | JobSummary | null | undefined,
  progress: unknown,
): JobDetail | JobSummary | null | undefined {
  if (!current) return current;
  return { ...current, progress };
}

export function JobDetailPanel({
  workspaceId,
  environmentId,
  redisInstanceId,
  queueName,
  jobId,
  listJob,
  canWrite = true,
  onRemoved,
}: {
  workspaceId: string;
  environmentId: string;
  redisInstanceId: string;
  queueName: string;
  jobId: string;
  listJob?: JobDetail | JobSummary;
  canWrite?: boolean;
  onRemoved?: () => void;
}) {
  const queryClient = useQueryClient();
  const [bookmarkPickerOpen, setBookmarkPickerOpen] = useState(false);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const jobInvalidateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const jobRoom = `job:${redisInstanceId}:${queueName}:${jobId}`;

  useEffect(() => {
    const queryKey = ["job", redisInstanceId, queueName, jobId] as const;

    subscribeRooms([jobRoom]);

    const offEvent = onSocketEvent((data) => {
      if (data.room !== jobRoom) return;

      if (data.type === "job:update") {
        const payload = data.payload as { job?: JobSummary };
        if (payload.job) {
          queryClient.setQueryData<JobDetail | JobSummary | null | undefined>(
            queryKey,
            (old) => mergeJobUpdate(old, payload.job!),
          );
        }
      }

      if (data.type === "job:progress") {
        const payload = data.payload as { progress?: unknown };
        queryClient.setQueryData<JobDetail | JobSummary | null | undefined>(
          queryKey,
          (old) => mergeProgressUpdate(old, payload.progress),
        );
      }

      if (data.type === "job:update" || data.type === "job:progress") {
        if (jobInvalidateTimer.current) clearTimeout(jobInvalidateTimer.current);
        jobInvalidateTimer.current = setTimeout(() => {
          void queryClient.invalidateQueries({
            queryKey,
          });
        }, 500);
      }
    });

    const offResync = onResync((data) => {
      if (data.room !== jobRoom) return;
      void queryClient.invalidateQueries({ queryKey });
    });

    return () => {
      offEvent();
      offResync();
      unsubscribeRooms([jobRoom]);
      if (jobInvalidateTimer.current) clearTimeout(jobInvalidateTimer.current);
    };
  }, [jobRoom, jobId, queueName, queryClient, redisInstanceId]);

  const listJobDetail = isJobDetail(listJob) ? listJob : undefined;

  const jobQuery = useQuery({
    queryKey: ["job", redisInstanceId, queueName, jobId],
    queryFn: () => rpcClient.job.get({ redisInstanceId, queueName, jobId }),
    initialData: listJobDetail,
    staleTime: listJobDetail ? Number.POSITIVE_INFINITY : 0,
  });

  const invalidateJob = () => {
    queryClient.invalidateQueries({ queryKey: ["job", redisInstanceId, queueName, jobId] });
    queryClient.invalidateQueries({
      queryKey: ["jobs", redisInstanceId, queueName],
    });
  };

  const runAction = async (action: () => Promise<unknown>) => {
    await action();
    invalidateJob();
  };

  const job = jobQuery.data;
  const showSummarySkeleton = jobQuery.isLoading;
  const isLoadingHeavyFields = !job && jobQuery.isLoading;
  const created = formatJobTimestamp(job?.timestamp);
  const started = formatJobTimestamp(job?.processedOn);
  const finished = formatJobTimestamp(job?.finishedOn);
  const maxAttempts = job?.opts?.attempts;
  const logs = job?.logs ?? [];

  return (
    <>
      <SheetHeader className="shrink-0 gap-2 border-b px-4 py-4 pr-12">
        <div className="flex items-start justify-between gap-3">
          <SheetTitle className="min-w-0 flex-1 truncate">
            Job <span className="font-mono">{jobId}</span>
          </SheetTitle>
          <div className="flex shrink-0 flex-wrap justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              disabled={showSummarySkeleton || !job || !canWrite}
              onClick={() => setBookmarkPickerOpen(true)}
            >
              <BookmarkIcon />
              Bookmark
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={showSummarySkeleton || !job || !canWrite}
              onClick={() =>
                void runAction(() =>
                  rpcClient.jobActions.retry({ redisInstanceId, queueName, jobId }),
                )
              }
            >
              Retry
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={showSummarySkeleton || !job || !canWrite}
              onClick={() =>
                void runAction(() =>
                  rpcClient.jobActions.replay({ redisInstanceId, queueName, jobId }),
                )
              }
            >
              <CopyIcon />
              Replay
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={showSummarySkeleton || !job || !canWrite}
              onClick={() =>
                void runAction(() =>
                  rpcClient.jobActions.promote({ redisInstanceId, queueName, jobId }),
                )
              }
            >
              Promote
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={showSummarySkeleton || !job || !canWrite}
              onClick={() => setRemoveConfirmOpen(true)}
            >
              Remove
            </Button>
            <AlertDialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove job?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Job <span className="font-mono">{jobId}</span> will be permanently removed from the queue. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() =>
                      void runAction(() =>
                        rpcClient.jobActions.remove({ redisInstanceId, queueName, jobId }),
                      ).then(() => onRemoved?.())
                    }
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        {showSummarySkeleton ? (
          <Skeleton className="h-3.5 w-48" />
        ) : (
          job && (
            <SheetDescription className="truncate">{job.name}</SheetDescription>
          )
        )}
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-5 text-xs">
          <section>
            <h3 className="mb-1.5 text-[11px] font-medium text-muted-foreground">
              Details
            </h3>
            {showSummarySkeleton ? (
              <div className="grid grid-cols-2 gap-x-6">
                <dl className="min-w-0 space-y-0.5">
                  <DetailRow label="Job ID" mono>
                    <span className="inline-flex min-w-0 items-center gap-0.5">
                      <span className="truncate">{jobId}</span>
                      <CopyButton value={jobId} />
                    </span>
                  </DetailRow>
                  <DetailRow label="Name">
                    <DetailValueSkeleton className="w-28" />
                  </DetailRow>
                  <DetailRow label="Queue" mono>
                    {queueName}
                  </DetailRow>
                  <DetailRow label="Created" mono>
                    <DetailValueSkeleton className="w-32" />
                  </DetailRow>
                  <DetailRow label="Started" mono>
                    <DetailValueSkeleton className="w-32" />
                  </DetailRow>
                  <DetailRow label="Finished" mono>
                    <DetailValueSkeleton className="w-32" />
                  </DetailRow>
                  <DetailRow label="Duration" mono>
                    <DetailValueSkeleton className="w-16" />
                  </DetailRow>
                </dl>
                <dl className="min-w-0 space-y-0.5">
                  <DetailRow label="Status">
                    <DetailValueSkeleton className="h-5 w-16 rounded-full" />
                  </DetailRow>
                  <DetailRow label="Attempts" mono>
                    <DetailValueSkeleton className="w-10" />
                  </DetailRow>
                  <DetailRow label="Priority" mono>
                    <DetailValueSkeleton className="w-8" />
                  </DetailRow>
                  <DetailRow label="Delay" mono>
                    <DetailValueSkeleton className="w-12" />
                  </DetailRow>
                </dl>
              </div>
            ) : !job ? (
              <p className="text-muted-foreground">Job not found</p>
            ) : (
              <div className="grid grid-cols-2 gap-x-6">
                <dl className="min-w-0 space-y-0.5">
                  <DetailRow label="Job ID" mono>
                    <span className="inline-flex min-w-0 items-center gap-0.5">
                      <span className="truncate">{job.id}</span>
                      <CopyButton value={job.id} />
                    </span>
                  </DetailRow>
                  <DetailRow label="Name">{job.name}</DetailRow>
                  <DetailRow label="Queue" mono>
                    {queueName}
                  </DetailRow>
                  <DetailRow label="Created" mono>
                    <span title={created.title}>{created.label}</span>
                  </DetailRow>
                  <DetailRow label="Started" mono>
                    <span title={started.title}>{started.label}</span>
                  </DetailRow>
                  <DetailRow label="Finished" mono>
                    <span title={finished.title}>{finished.label}</span>
                  </DetailRow>
                  <DetailRow label="Duration" mono>
                    {formatDuration(job.processedOn, job.finishedOn)}
                  </DetailRow>
                </dl>
                <dl className="min-w-0 space-y-0.5">
                  <DetailRow label="Status">
                    <JobStatusChip state={job.state} />
                  </DetailRow>
                  <DetailRow label="Attempts" mono>
                    {formatJobAttemptsValue(job.attemptsMade, maxAttempts)}
                  </DetailRow>
                  <DetailRow label="Priority" mono>
                    {job.priority ?? job.opts?.priority ?? "—"}
                  </DetailRow>
                  <DetailRow label="Delay" mono>
                    {formatDelay(job.delay ?? job.opts?.delay)}
                  </DetailRow>
                </dl>
              </div>
            )}
          </section>

          {job?.failedReason && (
            <>
              <Separator />
              <section>
                <h3 className="mb-2 font-medium text-destructive">Failed reason</h3>
                <CodeBlock code={job.failedReason} variant="destructive" />
              </section>
            </>
          )}

          {job?.stacktrace && job.stacktrace.length > 0 && (
            <>
              <Separator />
              <section>
                <h3 className="mb-2 font-medium text-muted-foreground">Stack trace</h3>
                <CodeBlock
                  code={job.stacktrace.join("\n")}
                  lang="javascript"
                  maxHeight="12rem"
                />
              </section>
            </>
          )}

          {job?.returnValue != null && (
            <>
              <Separator />
              <section>
                <h3 className="mb-2 font-medium text-muted-foreground">Return value</h3>
                <CodeBlock value={job.returnValue} />
              </section>
            </>
          )}

          {job?.opts && (
            <>
              <Separator />
              <section>
                <h3 className="mb-2 font-medium text-muted-foreground">Options</h3>
                <CodeBlock
                  value={{
                    attempts: job.opts.attempts,
                    backoff: job.opts.backoff,
                    priority: job.opts.priority,
                    delay: job.opts.delay,
                    removeOnComplete: job.opts.removeOnComplete,
                    removeOnFail: job.opts.removeOnFail,
                  }}
                />
              </section>
            </>
          )}

          <Separator />

          <section>
            <h3 className="mb-2 font-medium text-muted-foreground">Progress</h3>
            {isLoadingHeavyFields ? (
              <CodeBlockSkeleton lines={3} />
            ) : job?.progress &&
              typeof job.progress === "object" &&
              job.progress !== null &&
              Object.keys(job.progress).length > 0 ? (
              <div className="space-y-2">
                {"currentStep" in job.progress && (
                  <DetailRow label="Step">
                    {String((job.progress as { currentStep?: string }).currentStep)}
                  </DetailRow>
                )}
                {"percent" in job.progress && (
                  <DetailRow label="Percent">
                    {(job.progress as { percent?: number }).percent}%
                  </DetailRow>
                )}
                {"steps" in job.progress &&
                  Array.isArray((job.progress as { steps?: unknown[] }).steps) &&
                  (
                    job.progress as {
                      steps: Array<{ name: string; status: string }>;
                    }
                  ).steps.map((step) => (
                    <div key={step.name} className="flex gap-2">
                      <Badge variant="outline">{step.status}</Badge>
                      <span>{step.name}</span>
                    </div>
                  ))}
                {!("currentStep" in job.progress) &&
                  !("percent" in job.progress) &&
                  !("steps" in job.progress) && (
                    <CodeBlock value={job.progress} />
                  )}
              </div>
            ) : (
              <p className="text-muted-foreground">No progress</p>
            )}
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 font-medium text-muted-foreground">Payload</h3>
            {isLoadingHeavyFields ? (
              <CodeBlockSkeleton lines={6} />
            ) : job?.payload == null ? (
              <p className="text-muted-foreground">No payload</p>
            ) : (
              <CodeBlock value={job.payload} />
            )}
          </section>

          <Separator />

          <section>
            <h3 className="mb-2 font-medium text-muted-foreground">
              Logs {logs.length > 0 && `(${logs.length})`}
            </h3>
            {isLoadingHeavyFields ? (
              <CodeBlockSkeleton lines={5} />
            ) : logs.length === 0 ? (
              <p className="text-muted-foreground">No logs</p>
            ) : (
              <CodeBlock
                code={logs
                  .map((log: ParsedLog) =>
                    log.format === "json" && log.entry
                      ? `[${log.entry.level}] ${log.entry.message}`
                      : (log.raw ?? ""),
                  )
                  .join("\n")}
              />
            )}
          </section>
        </div>
      </div>

      <BookmarkFolderPicker
        open={bookmarkPickerOpen}
        onOpenChange={setBookmarkPickerOpen}
        workspaceId={workspaceId}
        redisInstanceId={redisInstanceId}
        queueName={queueName}
        jobId={jobId}
        environmentId={environmentId}
        canWrite={canWrite}
      />
    </>
  );
}
