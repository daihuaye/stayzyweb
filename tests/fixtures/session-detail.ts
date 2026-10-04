import type { Detail, EventRecord } from "@/lib/telemetry";
// Illustrative fixture, never a production session.
const start = 1791090000;
const iso = (offset: number) => new Date((start + offset) * 1000).toISOString();
const outcome: EventRecord = {
  event_id: "outcome",
  name: "session.completed",
  sequence: 12,
  occurred_at: iso(690),
  run_index: 1,
  properties: { status: "completed" },
  received_at: iso(710),
};
export const sessionDetail: Detail = {
  start: iso(0),
  end: iso(800),
  as_of: iso(800),
  environment: "test",
  session: {
    installation_id: "illustrative-installation",
    session_id: "illustrative-session",
    created_at: iso(0),
    last_activity: iso(690),
    last_received: iso(710),
    app_version: "1.1",
    status: "completed",
    state: "focused",
    configuration: { target_seconds: 600, buddy_tracking: true },
    configuration_available: true,
    buddy_tracking: true,
    possible_drop_off: false,
    error_count: 2,
    run_count: 2,
    totals: {
      progress: 1,
      present_seconds: 600,
      away_seconds: 18,
      manual_seconds: 30,
      technical_seconds: 42,
    },
  },
  configuration_changes: [],
  outcomes: [outcome],
  epochs: [],
  state_intervals: [
    { id: "prepare", kind: "camera_starting", started_at: start, duration: 12 },
    { id: "warm", kind: "warming_up", started_at: start + 12, duration: 15 },
    { id: "focus-1", kind: "focused", started_at: start + 27, duration: 260 },
    {
      id: "break",
      kind: "manual_break",
      started_at: start + 287,
      duration: 30,
    },
    {
      id: "recover",
      kind: "recovering",
      started_at: start + 317,
      duration: 15,
    },
    { id: "focus-2", kind: "focused", started_at: start + 332, duration: 340 },
  ],
  checkpoints: [
    { at: start + 287, progress: 0.43, present_seconds: 260, sequence: 4 },
    { at: start + 672, progress: 1, present_seconds: 600, sequence: 11 },
  ],
  checkpoint_count: 2,
  markers: [
    {
      event_id: "error",
      name: "camera.error",
      sequence: 7,
      occurred_at: iso(317),
      run_index: 1,
      properties: { reason: "frame_silence" },
    },
    outcome,
  ],
  marker_count: 2,
  snapshots: [
    {
      snapshot_id: "snapshot-example",
      revision: 1,
      expected_parts: 2,
      received_parts: 2,
      complete: true,
      outcome_sequence: 12,
    },
  ],
  selected_snapshot: {
    snapshot_id: "snapshot-example",
    revision: 1,
    expected_parts: 2,
    received_parts: 2,
    complete: true,
    outcome_sequence: 12,
    intervals: [
      {
        id: "buddy",
        kind: "buddy_visit",
        participant_id: "example-buddy",
        recognition_epoch_id: "example-epoch",
        started_at: start + 27,
        duration: 600,
      },
    ],
  },
};
