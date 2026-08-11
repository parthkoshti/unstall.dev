# Roadmap

Feature audit and priorities for unqueue.dev. Last reviewed: 2026-08-11.

## Current Feature Set

- Queue auto-discovery via Redis Registry API + SCAN fallback
- Live job inspection (payload, progress, structured logs, stacktrace, timeline)
- Socket.IO realtime with room subscriptions, sequence tracking, and catch-up/sync
- In-memory rolling-window metrics with periodic PostgreSQL persistence (1m–7d windows)
- Job actions: retry, remove, promote (single + bulk)
- Queue admin: pause, resume, drain, clean, obliterate
- Alert system with failure rate, stalled, queue lag, and waiting jobs conditions
- Bookmarks with folders, notes, and point-in-time job snapshots
- Workspace RBAC (owner > admin > member > viewer)
- Email/password auth with verification and password reset
- Multi-environment Redis instance management with encrypted credentials
- Dark/light theme
- Demo worker with 12 queues and 30+ job types

## Audit: Missing Features

### P0 — Critical

#### FlowProducer DAG Visualization

Competitors (Workbench, Muleta, bullstudio, Durabull) all render parent/child job relationships as an interactive DAG graph with per-node status and duration.

**Missing:**
- No DAG/flow graph for `FlowProducer` jobs
- No way to see parent→child relationships between jobs
- `waiting-children` state is listed as a filter but has no relationship rendering
- No "replay subtree" from a specific node

**Why:** Flows are how complex multi-step pipelines work (validate → charge → ship → notify). Without this, users can't debug why a parent job is stuck waiting.

#### Scheduler / Cron Management

Workbench and bullmq-dash show active schedulers, last/next run times, and let you pause/resume/edit cron expressions live.

**Missing:**
- No scheduler/cron management UI despite demo-worker using `upsertJobScheduler`
- No visibility into repeatable jobs or their schedules
- No ability to pause/resume/edit cron expressions from the dashboard
- No "run scheduler immediately" action for verification

#### Error Triage & Failure Grouping

Workbench groups failures by error class, ranks by frequency, and trends over time to spot regressions immediately.

**Missing:**
- Failed jobs are listed individually with no error grouping
- No "top failing job types" view
- No error frequency trends (is error X getting worse?)
- No way to see "this same error happened 500 times in the last hour"

---

### P1 — High

#### Job Replay

Some tools let you "replay" failed jobs by copying the payload into a new job, not just retrying the existing one. Some also offer a manual enqueue form.

**Missing:**
- No "replay" action (copy payload → add as new job) — only retry
- No manual job enqueue form for testing/debugging
- No way to clone a job's payload into a new job

#### Worker Health Metrics

Production setups need worker-level visibility: event loop lag, memory, Redis latency, concurrency utilization.

**Missing:**
- No worker-level metrics (only queue-level)
- No event loop lag monitoring
- No worker memory usage tracking
- No "worker utilization" metric (active jobs vs concurrency)
- Redis `getClientCounts` exists but no worker health dashboard

#### Prometheus Metrics Export

BullMQ ships `exportPrometheusMetrics()`. Prometheus + Grafana is the industry standard for production monitoring.

**Missing:**
- No Prometheus metrics endpoint
- No way to export queue metrics for external consumption
- Users can't plug metrics into existing Grafana dashboards

---

### P2 — Medium

#### OpenTelemetry Integration

BullMQ has first-class OTel support (`bullmq-otel`) with distributed tracing and context propagation across services.

**Missing:**
- No OpenTelemetry trace ingestion or visualization
- No way to correlate a job with its parent HTTP request trace
- No OTLP metrics endpoint
- No span visualization for job lifecycle

#### Keyboard Shortcuts

Workbench: `⌘K` search, `⌥1-9` switch queues, `R` retry, `↵` drill in. Every action one keystroke away.

**Missing:**
- No keyboard shortcut system
- Command palette exists but only for navigation, not actions
- No `R` to retry, no `D` to delete from job detail

#### Additional Alert Integrations

Competitors support Slack, email, PagerDuty, webhooks, and Linear.

**Missing:**
- Only Discord webhook for alerts
- No Slack, email, or PagerDuty integration
- No custom webhook payload format

---

### P3 — Nice to Have

#### Job Payload Editing Before Retry

Some tools let you edit a job's payload or modify retry options (delay, attempts) before retrying.

**Missing:**
- No ability to edit job payload before retry
- No ability to change retry options (backoff, attempts) from the UI

#### Log Aggregation / Search

Structured logs are shown per-job but not searchable across jobs.

**Missing:**
- No cross-job log search ("all error logs for queue X in the last hour")
- No log level filtering
- No correlation between logs and job failures

#### Rate Limit Visibility

BullMQ supports `getRateLimitTtl()`, `removeRateLimitKey()`, and limiter config on workers.

**Missing:**
- No display of rate limit status per queue
- No visibility into limiter configuration (max/duration)
- No way to see if a queue is currently rate-limited

#### Read-Only / Auditor Mode

Workbench supports a `readonly` flag that disables all destructive actions for stakeholder visibility.

**Missing:**
- No read-only mode beyond the existing RBAC viewer role

#### Job Tags / Custom Labels

Workbench supports `tags` from job data fields to make them filterable in the UI.

**Missing:**
- No custom tag extraction from job payloads
- No filtering by job metadata tags

---

## Competitive Landscape

| Feature | unqueue.dev | Workbench | Muleta | Durabull | bullstudio |
|---|---|---|---|---|---|
| Queue discovery | ✅ Auto | ✅ Manual | ✅ Auto | ✅ Auto | ✅ Auto |
| Realtime updates | ✅ Socket.IO | ✅ SSE | ✅ SSE | ✅ Polling | ✅ Polling |
| Job inspection | ✅ | ✅ | ✅ | ✅ | ✅ |
| Job actions | ✅ Retry/remove/promote | ✅ + replay | ✅ + replay | ✅ + replay | ✅ Retry/remove |
| Queue admin | ✅ Pause/drain/clean/obliterate | ✅ | ✅ | ✅ | ✅ |
| FlowProducer DAG | ❌ | ✅ | ✅ | ❌ | ✅ |
| Scheduler management | ❌ | ✅ | ❌ | ✅ | ❌ |
| Error grouping | ❌ | ✅ | ❌ | ❌ | ❌ |
| Metrics/charts | ✅ In-memory | ✅ Built-in | ❌ | ✅ | ✅ |
| Prometheus export | ❌ | ❌ | ❌ | ✅ | ❌ |
| OpenTelemetry | ❌ | ❌ | ❌ | ❌ | ❌ |
| Alerting | ✅ Discord | ✅ Slack/webhook | ❌ | ✅ Email/webhook/Linear | ✅ |
| Auth/RBAC | ✅ Full | ✅ Basic auth | ❌ | ❌ | ❌ |
| Multi-workspace | ✅ | ❌ | ❌ | ❌ | ❌ |
| Bookmarks | ✅ | ❌ | ❌ | ❌ | ❌ |
| Keyboard shortcuts | ❌ | ✅ | ❌ | ❌ | ❌ |
| Self-hosted | ✅ Docker | ✅ Docker/npm | ✅ Docker | ✅ Docker | ❌ Hosted |

## Test Coverage Gaps

| Area | Status |
|---|---|
| Package unit tests | ✅ 12 test files |
| API integration tests | ❌ No end-to-end RPC tests |
| UI component tests | ❌ No React component tests |
| E2E tests | ❌ No Playwright/Cypress |
| Alert engine integration | ⚠️ Unit only |
| Realtime manager | ❌ No tests |
| Bookmark service | ❌ No tests |
