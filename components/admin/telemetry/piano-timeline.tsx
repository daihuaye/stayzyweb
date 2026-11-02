"use client";

import { useState } from "react";
import { pianoTimeline } from "@/lib/piano-timeline";
import { date, duration, pianoTelemetry, type Detail } from "@/lib/telemetry";
import { Button } from "@/components/ui/button";
import { Card, Empty } from "./charts";
import { useLocalTimeZone } from "./local-time";

export function PianoTimeline({ data }: { data: Detail }) {
  const timeZone = useLocalTimeZone();
  const [page, setPage] = useState(0);
  const { points, windows, playing, gaps } = pianoTimeline(data);
  const measured = pianoTelemetry(data.session.totals);
  const formatTime = (at: number) => date(at, timeZone);
  const pageCount = Math.max(1, Math.ceil(playing.length / 20));
  const currentPage = Math.min(page, pageCount - 1);
  const first = points.reduce((value, p) => Math.min(value, p.at), Infinity);
  const last = points.reduce((value, p) => Math.max(value, p.at), -Infinity);
  const maximum = points.reduce((value, p) => Math.max(value, p.seconds), 1);
  const x = (at: number) =>
    64 + ((at - first) / Math.max(1, last - first)) * 772;
  const y = (seconds: number) => 180 - (seconds / maximum) * 150;
  return (
    <Card
      title="Piano playing timeline"
      note="Piano time comes from audio tracking; focus and presence states measure something different."
    >
      <p className="text-sm leading-6">
        Recorded piano playing:{" "}
        <strong className="tabular-nums">{measured.duration}</strong> ·{" "}
        {measured.status}
      </p>
      {!points.length ? (
        <Empty>
          No timestamped piano measurements are available. A session total alone
          cannot show when playing happened.
        </Empty>
      ) : (
        <div className="mt-4 space-y-4">
          <p className="max-w-3xl text-xs leading-5 text-muted-foreground">
            Each dot is a cumulative measurement. The increase between two dots
            is playing time recorded within that window, not continuous playing
            for the whole window. Exact playing start/stop times are not
            recorded. Times use {timeZone}.
          </p>
          <p className="text-xs text-muted-foreground sm:hidden">
            Scroll the chart horizontally to see the full timeline.
          </p>
          <div
            role="region"
            aria-label="Piano playing chart"
            tabIndex={0}
            className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg
              role="img"
              aria-label="Cumulative piano playing time by local timestamp"
              viewBox="0 0 900 260"
              className="w-full min-w-[600px]"
            >
              <title>Cumulative piano playing time</title>
              {[0, 0.5, 1].map((fraction) => (
                <g key={fraction}>
                  <line
                    x1="64"
                    x2="836"
                    y1={y(maximum * fraction)}
                    y2={y(maximum * fraction)}
                    stroke="var(--border)"
                  />
                  <text
                    x="54"
                    y={y(maximum * fraction) + 4}
                    textAnchor="end"
                    fontSize="11"
                    fill="var(--muted-foreground)"
                  >
                    {Math.round(((maximum * fraction) / 60) * 10) / 10}m
                  </text>
                </g>
              ))}
              {windows.map(({ from, to, seconds }) => (
                <line
                  key={`${from.sequence}/${to.sequence}`}
                  x1={x(from.at)}
                  x2={x(to.at)}
                  y1={y(from.seconds)}
                  y2={y(to.seconds)}
                  stroke={
                    seconds > 0 ? "var(--primary)" : "var(--muted-foreground)"
                  }
                  strokeWidth="2"
                  strokeDasharray={seconds > 0 ? undefined : "4 4"}
                />
              ))}
              {points.map((p) => (
                <circle
                  key={p.sequence}
                  cx={x(p.at)}
                  cy={y(p.seconds)}
                  r="3"
                  fill="var(--primary)"
                >
                  <title>{`${formatTime(p.at)} · ${duration(p.seconds)} total`}</title>
                </circle>
              ))}
              <text x="64" y="210" fontSize="11" fill="var(--muted-foreground)">
                {formatTime(first)}
              </text>
              {last > first && (
                <text
                  x="836"
                  y="230"
                  textAnchor="end"
                  fontSize="11"
                  fill="var(--muted-foreground)"
                >
                  {formatTime(last)}
                </text>
              )}
              <text x="64" y="252" fontSize="11" fill="var(--muted-foreground)">
                Solid: playing time increased · Dashed: no increase recorded
              </text>
            </svg>
          </div>
          {(points[0].seconds > 0 || gaps > 0) && (
            <p className="text-xs leading-5 text-muted-foreground">
              {points[0].seconds > 0 &&
                `${duration(points[0].seconds)} was already recorded at the first retained measurement and cannot be placed in an earlier time window. `}
              {gaps > 0 &&
                `${gaps} measurement gap(s) are left unconnected because of an app run change, clock inconsistency or counter reset.`}
            </p>
          )}
          {playing.length ? (
            <div>
              <h4 className="text-sm font-medium">When playing was recorded</h4>
              <ul
                className="mt-2 divide-y divide-border text-xs sm:hidden"
                aria-label="Piano playing windows on mobile"
              >
                {playing
                  .slice(currentPage * 20, (currentPage + 1) * 20)
                  .map(({ from, to, seconds }) => (
                    <li
                      key={`${from.sequence}/${to.sequence}`}
                      className="space-y-1 py-3"
                    >
                      <p className="font-medium">
                        {duration(seconds)} playing recorded
                      </p>
                      <p className="tabular-nums text-muted-foreground">
                        From {formatTime(from.at)}
                        <br />
                        To {formatTime(to.at)}
                      </p>
                    </li>
                  ))}
              </ul>
              <div
                role="region"
                aria-label="Piano playing windows"
                tabIndex={0}
                className="mt-2 hidden overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary sm:block"
              >
                <table className="w-full min-w-[580px] text-left text-xs tabular-nums">
                  <caption className="sr-only">
                    Playing time added between retained measurements. Windows do
                    not identify exact playing bouts.
                  </caption>
                  <thead>
                    <tr className="border-b border-border">
                      <th scope="col" className="py-3 pr-4">
                        From · local time
                      </th>
                      <th scope="col" className="pr-4">
                        To · local time
                      </th>
                      <th scope="col">Playing recorded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playing
                      .slice(currentPage * 20, (currentPage + 1) * 20)
                      .map(({ from, to, seconds }) => (
                        <tr
                          key={`${from.sequence}/${to.sequence}`}
                          className="border-b border-border/60"
                        >
                          <td className="py-3 pr-4">{formatTime(from.at)}</td>
                          <td className="pr-4">{formatTime(to.at)}</td>
                          <td className="font-medium">{duration(seconds)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              {pageCount > 1 && (
                <div className="mt-3 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    disabled={currentPage === 0}
                    onClick={() => setPage(currentPage - 1)}
                  >
                    Previous windows
                  </Button>
                  <span className="text-xs">
                    {currentPage + 1} / {pageCount}
                  </span>
                  <Button
                    variant="ghost"
                    disabled={currentPage + 1 === pageCount}
                    onClick={() => setPage(currentPage + 1)}
                  >
                    Next windows
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {points.length < 2
                ? "At least two measurements are needed to locate playing within a time window."
                : "No increase in piano time can be placed between these measurements."}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
