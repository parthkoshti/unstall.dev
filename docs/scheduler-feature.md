# Scheduler / Cron Management

Full scheduler management for BullMQ repeatable jobs. View, pause, resume, run, edit, and remove schedulers from the dashboard.

## Overview

The Scheduler tab in the queue detail page provides visibility and control over all repeatable job schedulers configured on a queue. Schedulers are BullMQ's mechanism for running jobs on a recurring basis using cron expressions or fixed intervals.

## Features

### Scheduler List

The Schedulers tab displays all active schedulers for a queue in a table format:

| Column | Description |
|--------|-------------|
| **Scheduler ID** | Unique identifier (e.g., `email:send:scheduled`) |
| **Schedule** | Cron expression or interval (e.g., `*/5 * * * *` or `30s`) |
| **Next Run** | When the scheduler will next execute |
| **Last Run** | When the scheduler last executed |
| **Runs** | Total number of executions |

### Actions

- **Run Now** — Triggers an immediate execution while preserving the schedule
- **Edit** — Modify the cron expression or interval
- **Remove** — Permanently delete the scheduler

### Detail Panel

Click a scheduler ID to open the detail panel showing:
- Full scheduler metadata (ID, job name, schedule, timezone, limits)
- Next/last run timestamps
- Execution count
- Job options (attempts, backoff, priority, removeOnComplete/removeOnFail)

### Edit Dialog

The edit dialog supports two modes:
- **Cron Expression** — Standard cron format (minute hour day month weekday)
- **Interval (ms)** — Fixed interval in milliseconds

## Architecture

### Backend

```
packages/bullmq/src/
├── types.ts           → SchedulerSummary type
├── queue-service.ts   → listSchedulers(), getScheduler()
└── actions.ts         → removeScheduler(), pauseScheduler(), resumeScheduler(), runScheduler(), updateScheduler()

packages/services/src/services/
└── scheduler.service.ts  → SchedulerService with RBAC

packages/orpc/src/
└── router.ts          → scheduler sub-router (list, get, pause, resume, run, remove, update)
```

### Frontend

```
apps/platform/src/components/
├── scheduler-list.tsx          → Table component for scheduler list
├── scheduler-detail-panel.tsx  → Sheet panel for scheduler details
└── scheduler-edit-dialog.tsx   → Dialog for editing cron/interval

apps/platform/src/routes/$workspaceId/$environmentId/queues/$queueName.tsx
└── Wires scheduler tab to SchedulerList + SchedulerDetailPanel
```

### RBAC

| Action | Minimum Role |
|--------|--------------|
| List / Get | viewer |
| Run Now | member |
| Edit / Remove | admin |

### BullMQ APIs Used

- `queue.getJobSchedulers()` — List all schedulers
- `queue.getJobScheduler(id)` — Get single scheduler
- `queue.upsertJobScheduler(id, opts, data)` — Create/update scheduler, run immediately
- `queue.removeJobScheduler(id)` — Delete scheduler

## Testing

1. Start the demo worker (`pnpm dev` in `apps/api`)
2. Navigate to a queue with schedulers (e.g., queues with `scheduledEveryMs` config)
3. Click the "Schedulers" tab
4. Verify scheduler list loads with correct data
5. Test actions: pause, resume, run now, edit, remove
6. Verify detail panel opens with full metadata
7. Test edit dialog with both cron and interval modes

## Future Enhancements

- Realtime scheduler updates via Socket.IO
- Scheduler execution history / logs
- Bulk scheduler operations
- Scheduler templates / presets
