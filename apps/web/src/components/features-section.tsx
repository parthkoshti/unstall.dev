const features = [
  {
    eyebrow: "Job inspection",
    headline: "Know exactly why a job failed.",
    body: "A failure count tells you nothing. unqueue surfaces the full picture: error message, stack trace, the input data that triggered it, and every structured log your worker emitted — all attached to that specific job.",
    details: [
      "Full stack trace on every failure",
      "Input data and return value stored with the job",
      "Structured worker logs tied to the job that produced them",
    ],
    preview: <FailurePreview />,
  },
  {
    eyebrow: "Queue discovery",
    headline: "All your queues, no setup required.",
    body: "Most tools require you to register queues manually. unqueue reads BullMQ's key schema directly from Redis. New queues appear the moment workers create them — nothing to configure, nothing to maintain.",
    details: [
      "Auto-discovery via BullMQ key prefix scan",
      "Queues appear and disappear automatically",
      "Works with any BullMQ key prefix",
    ],
    preview: <QueueDiscoveryPreview />,
  },
  {
    eyebrow: "Admin actions",
    headline: "Fix problems without redis-cli.",
    body: "When jobs pile up or fail in bulk, you need to move fast. Retry, pause, drain, or obliterate — directly from the dashboard. No hand-crafted Redis commands, no context-switching to a terminal.",
    details: [
      "Retry failed jobs individually or in bulk",
      "Pause, drain, clean, and obliterate queues",
      "Discord alerts when queues spike or jobs consistently fail",
    ],
    preview: <AdminPreview />,
  },
  {
    eyebrow: "Worker logs",
    headline: "Logs tied to the job that produced them.",
    body: "Worker logs are often the missing piece in debugging. unqueue captures structured logs from your workers and links them to the specific job that triggered them. No more grepping through CloudWatch or tailing files.",
    details: [
      "Structured log capture (info, warn, error levels)",
      "Logs automatically linked to the triggering job",
      "Filter by job ID, queue, or log level",
    ],
    preview: <WorkerLogsPreview />,
  },
  {
    eyebrow: "Alerting",
    headline: "Know about failures before your users do.",
    body: "Set thresholds for failure rates, queue depth, and processing latency. When something breaks, get a Discord notification with the queue name, failure count, and a direct link to the problem — not a generic 'something went wrong' ping.",
    details: [
      "Discord alerts on failure rate spikes",
      "Queue depth and latency threshold alerts",
      "Alert history and resolution tracking",
    ],
    preview: <AlertingPreview />,
  },
  {
    eyebrow: "Multi-connection",
    headline: "One dashboard for every Redis instance.",
    body: "Run staging, production, and regional workers in separate Redis instances? Connect them all. Each connection gets its own set of queues, isolated from the rest. No context-switching between tools.",
    details: [
      "Add unlimited Redis connections",
      "Each connection shows only its own queues",
      "Works with any managed or self-hosted Redis",
    ],
    preview: <MultiConnectionPreview />,
  },
  {
    eyebrow: "Metrics",
    headline: "See trends, not just snapshots.",
    body: "Real-time metrics show job throughput, processing latency, and failure rates over time. Spot regressions after deploys, identify slow queues, and track recovery — without setting up Prometheus or Grafana.",
    details: [
      "Throughput, latency, and failure rate graphs",
      "Historical trends across hours, days, or weeks",
      "Compare metrics before and after deploys",
    ],
    preview: <MetricsPreview />,
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-24 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-16 max-w-lg">
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Built around how engineers actually debug queues.
          </h2>
          <p className="text-base text-muted-foreground">
            Not a generic APM bolted onto BullMQ. A tool that reads BullMQ's
            data model directly and shows you what actually matters.
          </p>
        </div>

        <div className="space-y-6">
          {features.map((f) => (
            <div
              key={f.eyebrow}
              className="grid overflow-hidden rounded-2xl border border-border bg-card sm:grid-cols-2"
            >
              {/* Content */}
              <div className="flex flex-col justify-center p-8">
                <p className="mb-3 font-mono text-xs font-medium uppercase tracking-widest text-primary">
                  {f.eyebrow}
                </p>
                <h3 className="mb-3 text-xl font-semibold tracking-tight text-foreground">
                  {f.headline}
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
                <ul className="space-y-2">
                  {f.details.map((d) => (
                    <li key={d} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary/60" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preview */}
              <div className="border-t border-border bg-background/50 p-6 sm:border-l sm:border-t-0">
                {f.preview}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FailurePreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs text-muted-foreground">job #18204</span>
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">failed</span>
        </div>
        <div className="space-y-2">
          <div className="rounded border border-red-500/20 bg-red-500/5 p-2.5">
            <p className="font-mono text-xs text-red-400">Error: Sharp conversion failed</p>
            <p className="mt-1 font-mono text-xs text-muted-foreground">at processImage (worker.ts:84)</p>
            <p className="font-mono text-xs text-muted-foreground">at Worker.process (worker.ts:41)</p>
          </div>
          <div className="rounded border border-border p-2.5">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Input data</p>
            <p className="font-mono text-xs text-foreground/70">{"{ fileId: \"img_9f3a\", format: \"webp\" }"}</p>
          </div>
          <div className="rounded border border-border p-2.5">
            <p className="mb-1 text-xs font-medium text-muted-foreground">Worker logs</p>
            <p className="font-mono text-xs text-muted-foreground">info  Downloading file img_9f3a</p>
            <p className="font-mono text-xs text-muted-foreground">info  Converting to webp (1920x1080)</p>
            <p className="font-mono text-xs text-red-400/80">error Unsupported pixel format: cmyk</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueDiscoveryPreview() {
  const queues = [
    { name: "email-queue",      count: 3,  new: false },
    { name: "image-processing", count: 8,  new: false },
    { name: "notifications",    count: 1,  new: false },
    { name: "pdf-export",       count: 2,  new: true  },
  ];

  return (
    <div className="space-y-2">
      <div className="mb-3 flex items-center gap-2">
        <span className="h-px flex-1 bg-border/50" />
        <span className="font-mono text-xs text-muted-foreground">key prefix: bull</span>
        <span className="h-px flex-1 bg-border/50" />
      </div>
      {queues.map((q) => (
        <div
          key={q.name}
          className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
            q.new ? "border-primary/30 bg-primary/5" : "border-border bg-card"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-foreground">{q.name}</span>
            {q.new && (
              <span className="rounded-full bg-primary/15 px-1.5 py-0.5 font-mono text-xs text-primary">new</span>
            )}
          </div>
          <span className="tabular-nums text-xs text-muted-foreground">{q.count} active</span>
        </div>
      ))}
      <p className="pt-1 text-center font-mono text-xs text-muted-foreground/60">
        pdf-export appeared when a worker registered it
      </p>
    </div>
  );
}

function AdminPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-xs text-foreground">email-queue</span>
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs text-red-400">47 failed</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Retry all failed",  variant: "primary" },
            { label: "Pause queue",       variant: "default" },
            { label: "Clean completed",   variant: "default" },
            { label: "Drain queue",       variant: "default" },
          ].map((action) => (
            <button
              key={action.label}
              className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                action.variant === "primary"
                  ? "bg-primary/15 text-primary"
                  : "border border-border text-muted-foreground"
              }`}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Discord alert</p>
        <div className="rounded border border-border bg-background/50 p-2">
          <p className="text-xs text-foreground/70">🔴 <span className="font-medium">email-queue</span> failure rate exceeded 5% over 15 minutes</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">47 failed · 0 active · production</p>
        </div>
      </div>
    </div>
  );
}

function WorkerLogsPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-xs text-foreground">job #18204 · email-queue</span>
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">linked</span>
        </div>
        <div className="space-y-1.5 rounded border border-border bg-background/50 p-2.5">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-success" />
            <p className="font-mono text-xs text-muted-foreground">info  Sending email to user@example.com</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-success" />
            <p className="font-mono text-xs text-muted-foreground">info  Template loaded: welcome-email</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-success" />
            <p className="font-mono text-xs text-muted-foreground">info  Email sent successfully (234ms)</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-red-400" />
            <p className="font-mono text-xs text-red-400/80">error Rate limit exceeded, retrying in 30s</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <span className="rounded-md border border-border bg-background/50 px-2 py-1 font-mono text-xs text-muted-foreground">filter: level=error</span>
        <span className="rounded-md border border-border bg-background/50 px-2 py-1 font-mono text-xs text-muted-foreground">2 errors · 12 info</span>
      </div>
    </div>
  );
}

function AlertingPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Active alerts</p>
        <div className="space-y-2">
          {[
            { queue: "email-queue", rule: "failure rate > 5%", status: "firing", color: "red" },
            { queue: "image-processing", rule: "queue depth > 100", status: "resolved", color: "green" },
            { queue: "notifications", rule: "latency p99 > 2s", status: "firing", color: "red" },
          ].map((alert) => (
            <div key={alert.queue} className="flex items-center justify-between rounded-md border border-border px-2.5 py-2">
              <div>
                <p className="text-xs font-medium text-foreground">{alert.queue}</p>
                <p className="font-mono text-xs text-muted-foreground">{alert.rule}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                alert.status === "firing" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
              }`}>
                {alert.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Discord notification</p>
        <div className="rounded border border-border bg-background/50 p-2">
          <p className="text-xs text-foreground/70">🔴 <span className="font-medium">email-queue</span> failure rate exceeded 5% over 15 minutes</p>
          <p className="mt-0.5 font-mono text-xs text-muted-foreground">47 failed · 0 active · production</p>
        </div>
      </div>
    </div>
  );
}

function MultiConnectionPreview() {
  const connections = [
    { name: "production", queues: 4, status: "connected", latency: "2ms" },
    { name: "staging", queues: 3, status: "connected", latency: "5ms" },
    { name: "analytics", queues: 2, status: "connected", latency: "3ms" },
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">Redis connections</p>
        <div className="space-y-2">
          {connections.map((conn) => (
            <div key={conn.name} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-success" />
                <div>
                  <p className="font-mono text-xs text-foreground">{conn.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{conn.queues} queues</p>
                </div>
              </div>
              <span className="font-mono text-xs text-muted-foreground">{conn.latency}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-md border border-border bg-background/50 p-2">
        <p className="text-center font-mono text-xs text-muted-foreground/60">switch between connections in the sidebar</p>
      </div>
    </div>
  );
}

function MetricsPreview() {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">email-queue · last 24h</p>
          <span className="font-mono text-xs text-success">+12% throughput</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Throughput", value: "1,247", unit: "jobs/hr" },
            { label: "Latency p99", value: "340", unit: "ms" },
            { label: "Failure rate", value: "1.2", unit: "%" },
          ].map((metric) => (
            <div key={metric.label} className="rounded border border-border p-2">
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="font-mono text-lg font-semibold text-foreground">{metric.value}<span className="text-xs text-muted-foreground"> {metric.unit}</span></p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-1">
          {[40, 65, 45, 80, 55, 70, 90, 60, 75, 50, 85, 65].map((h, i) => (
            <div key={i} className="flex-1 flex items-end">
              <div className="w-full rounded-sm bg-primary/30" style={{ height: `${h}%` }} />
            </div>
          ))}
        </div>
        <p className="mt-1 text-center font-mono text-xs text-muted-foreground/60">hourly throughput · last 12h</p>
      </div>
    </div>
  );
}
