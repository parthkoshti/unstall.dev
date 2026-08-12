import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ScheduleMode = "cron" | "every";

export function SchedulerEditDialog({
  open,
  onOpenChange,
  schedulerId,
  initialPattern,
  initialEvery,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedulerId: string;
  initialPattern?: string;
  initialEvery?: number;
  onSave: (updates: { pattern?: string; every?: number }) => void;
}) {
  const [mode, setMode] = useState<ScheduleMode>(
    initialPattern ? "cron" : "every",
  );
  const [pattern, setPattern] = useState(initialPattern ?? "");
  const [every, setEvery] = useState(
    initialEvery?.toString() ?? "60000",
  );

  const handleSave = () => {
    if (mode === "cron") {
      onSave({ pattern: pattern.trim() || undefined });
    } else {
      const ms = parseInt(every, 10);
      if (!isNaN(ms) && ms > 0) {
        onSave({ every: ms });
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Scheduler</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {schedulerId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("cron")}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "cron"
                  ? "border-foreground bg-muted text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Cron Expression
            </button>
            <button
              type="button"
              onClick={() => setMode("every")}
              className={cn(
                "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "every"
                  ? "border-foreground bg-muted text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              Interval (ms)
            </button>
          </div>

          {mode === "cron" ? (
            <div className="space-y-2">
              <label htmlFor="cron-pattern" className="text-sm font-medium">
                Cron Pattern
              </label>
              <Input
                id="cron-pattern"
                placeholder="*/5 * * * *"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Standard cron format: minute hour day month weekday
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="interval-ms" className="text-sm font-medium">
                Interval (milliseconds)
              </label>
              <Input
                id="interval-ms"
                type="number"
                placeholder="60000"
                min="1"
                value={every}
                onChange={(e) => setEvery(e.target.value)}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                {formatIntervalPreview(every)}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function formatIntervalPreview(msStr: string): string {
  const ms = parseInt(msStr, 10);
  if (isNaN(ms) || ms <= 0) return "Enter a valid interval";

  if (ms < 1000) return `Runs every ${ms}ms`;
  if (ms < 60_000) return `Runs every ${(ms / 1000).toFixed(1)}s`;
  if (ms < 3_600_000) return `Runs every ${Math.round(ms / 60_000)}m`;
  return `Runs every ${(ms / 3_600_000).toFixed(1)}h`;
}
