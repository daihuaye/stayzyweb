import type { Overview, Health } from "@/lib/telemetry";

const meta = {
  start: "2026-09-05T12:00:00Z",
  end: "2026-09-12T12:00:00Z",
  as_of: "2026-09-12T12:00:00Z",
  environment: "production",
};
export const overview = {
  ...meta,
  summary: {
    active_installations: 24,
    foreground_seconds: 54000,
    sessions_started: 40,
    sessions_observed: 50,
    completed: 30,
    failed: 5,
    incomplete: 15,
    possible_drop_offs: 3,
  },
  daily: [
    {
      day: "2026-09-10",
      foreground_seconds: 18000,
      completions: 8,
      failures: 1,
    },
    {
      day: "2026-09-11",
      foreground_seconds: 21600,
      completions: 12,
      failures: 3,
    },
    {
      day: "2026-09-12",
      foreground_seconds: 14400,
      completions: 10,
      failures: 1,
    },
  ],
  attempts: { tapped: 45, created: 40, gated: 5 },
  setup_views: 8,
  permission_denials: 2,
  funnel: [
    { label: "started", value: 40 },
    { label: "authorized", value: 38 },
    { label: "first_frame", value: 35 },
  ],
  waits: [
    { label: "camera_starting", value: 420 },
    { label: "recovering", value: 180 },
  ],
  screens: [
    { label: "focus", value: 36000 },
    { label: "setup", value: 18000 },
  ],
  outcomes: [
    { label: "completed", value: 30, mean_progress: 1 },
    { label: "failed", value: 5, mean_progress: 0.25 },
    { label: "inProgress", value: 15, mean_progress: 0.4 },
  ],
  quality: {
    events: 1234,
    dropped_events: 2,
    incomplete_snapshots: 3,
    expected_snapshots: 35,
    mean_delivery_lag_seconds: 90,
    max_delivery_lag_seconds: 7200,
    clock_skew_events: 1,
  },
  app_versions: ["1.0", "1.1"],
} as unknown as Overview;
export const health = {
  ...meta,
  summary: {
    first_frames: 35,
    attempts: 40,
    startup_mean_seconds: 0.8,
    startup_max_seconds: 4.2,
    mean_processing_ms: 18.4,
    max_processing_ms: 120,
    samples: 9000,
    recoveries: 6,
    degraded_seconds: 600,
    missing_samples: 45,
    known_seconds: 3600,
    unknown_seconds: 1200,
    estimated_seconds: 900,
    attribution_measured_seconds: 4800,
    attribution_sessions: 10,
    ambiguous_samples: 12,
    stale_tracks: 3,
  },
  daily: [
    { day: "2026-09-10", mean_processing_ms: 19 },
    { day: "2026-09-11", mean_processing_ms: 18 },
    { day: "2026-09-12", mean_processing_ms: 18.2 },
  ],
  versions: [
    { app_version: "1.0", mean_processing_ms: 20 },
    { app_version: "1.1", mean_processing_ms: 17 },
  ],
  errors: [
    { name: "camera.error", reason: "frame_silence", count: 5 },
    { name: "recognition.error", reason: "processing_timeout", count: 2 },
  ],
  diagnostics: [],
} as unknown as Health;
