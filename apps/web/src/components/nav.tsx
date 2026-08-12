import { useState } from "react";
import {
  GithubIcon,
  MenuIcon,
  MoonIcon,
  SunIcon,
  XIcon,
} from "lucide-react";
import { LogoQueueLinesIcon } from "@/components/logo-options";
import { ThemeProvider, useTheme, type Theme } from "@/lib/theme";

const CYCLE: Theme[] = ["dark", "light"];
const WAITLIST_INPUT_ID = "hero-waitlist-email";
const ANCHOR_SCROLL_OFFSET = 96;

interface NavProps {
  currentPath: string;
}

export function Nav({ currentPath }: NavProps) {
  return (
    <ThemeProvider>
      <NavInner currentPath={currentPath} />
    </ThemeProvider>
  );
}

function scrollToHash(hash: string) {
  const target = document.getElementById(hash);
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({
    top: Math.max(top - ANCHOR_SCROLL_OFFSET, 0),
    behavior: "smooth",
  });
}

function focusWaitlistInput() {
  requestAnimationFrame(() => {
    document.getElementById(WAITLIST_INPUT_ID)?.focus({ preventScroll: true });
  });
}

function useHashNav(hash: string, currentPath: string) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (currentPath === "/") {
      scrollToHash(hash);
    } else {
      window.location.href = `/#${hash}`;
    }
  };
}

function NavInner({ currentPath }: NavProps) {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  function handleWaitlistClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    if (currentPath === "/") {
      scrollToHash("waitlist");
      focusWaitlistInput();
    } else {
      window.location.href = "/#waitlist";
    }
  }

  function cycleTheme() {
    const next = CYCLE[(CYCLE.indexOf(theme) + 1) % CYCLE.length]!;
    setTheme(next);
  }

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <div className="w-full max-w-6xl">
        <nav className="relative flex items-center justify-between rounded-2xl border border-border/50 bg-background/70 px-4 py-2.5 backdrop-blur-md backdrop-saturate-150">
          <a
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <LogoQueueLinesIcon size={28} />
            <span className="font-mono text-sm font-semibold text-foreground">
              unqueue
            </span>
          </a>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-5 md:flex">
            <HashLink
              hash="features"
              label="Features"
              currentPath={currentPath}
            />
            <HashLink
              hash="how-it-works"
              label="How it works"
              currentPath={currentPath}
            />
            <a
              href="/roadmap"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Roadmap
            </a>
            <a
              href="/docs/introduction"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Self Hosting Docs
            </a>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle theme={theme} onClick={cycleTheme} />
            <a
              href="https://github.com/parthkoshti/unqueue.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-border/60 px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <GithubIcon className="size-4" />
              Star us on GitHub
            </a>
            <a
              href="/#waitlist"
              className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              onClick={handleWaitlistClick}
            >
              Waitlist
            </a>
          </div>

          <button
            type="button"
            className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? (
              <XIcon className="size-4" />
            ) : (
              <MenuIcon className="size-4" />
            )}
          </button>
        </nav>

        {open && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-border/50 bg-background/80 p-3 backdrop-blur-md backdrop-saturate-150 md:hidden">
            <div className="flex flex-col gap-0.5">
              {[
                { label: "Features", hash: "features" },
                { label: "How it works", hash: "how-it-works" },
              ].map((item) => (
                <HashLink
                  key={item.label}
                  hash={item.hash}
                  label={item.label}
                  currentPath={currentPath}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onNavigate={() => setOpen(false)}
                />
              ))}
              <a
                href="/docs/introduction"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Self Hosting Docs
              </a>
              <a
                href="/roadmap"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                Roadmap
              </a>
              <a
                href="https://github.com/parthkoshti/unqueue.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                Star us on GitHub
              </a>
              <div className="mt-2 flex flex-col gap-2 border-t border-border/40 pt-2">
                <button
                  type="button"
                  onClick={cycleTheme}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <ThemeIcon theme={theme} />
                  {theme === "dark" ? "Dark theme" : "Light theme"}
                </button>
                <div className="grid gap-2">
                  <a
                    href="/#waitlist"
                    className="rounded-lg bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    onClick={(e) => {
                      setOpen(false);
                      handleWaitlistClick(e);
                    }}
                  >
                    Waitlist
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ThemeIcon({ theme }: { theme: Theme }) {
  if (theme === "dark") return <MoonIcon className="size-3.5" />;
  return <SunIcon className="size-3.5" />;
}

function HashLink({
  hash,
  label,
  currentPath,
  className = "text-sm text-muted-foreground transition-colors hover:text-foreground",
  onNavigate,
}: {
  hash: string;
  label: string;
  currentPath: string;
  className?: string;
  onNavigate?: () => void;
}) {
  const handleClick = useHashNav(hash, currentPath);
  return (
    <a
      href={`/#${hash}`}
      className={className}
      onClick={(e) => {
        handleClick(e);
        onNavigate?.();
      }}
    >
      {label}
    </a>
  );
}

function ThemeToggle({
  theme,
  onClick,
}: {
  theme: Theme;
  onClick: () => void;
}) {
  const labels: Record<Theme, string> = {
    light: "Light",
    dark: "Dark",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Theme: ${labels[theme]}. Click to cycle.`}
      className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <ThemeIcon theme={theme} />
    </button>
  );
}
