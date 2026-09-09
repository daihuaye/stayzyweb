import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  AudioLines,
  Check,
  Eye,
  Leaf,
  LockKeyhole,
  Pause,
  Sparkles,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Brand } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
function appStoreUrl() {
  try {
    const url = new URL(process.env.STAYZY_APP_STORE_URL || "");
    return url.protocol === "https:" && url.hostname === "apps.apple.com"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export default function Home() {
  const download = appStoreUrl();
  return (
    <>
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-6 py-7 lg:px-12">
        <Brand />
        <nav
          aria-label="Main navigation"
          className="flex items-center gap-6 text-sm"
        >
          <a
            href="#how-it-works"
            className="hidden min-h-11 items-center text-muted-foreground hover:text-foreground sm:inline-flex"
          >
            How it works
          </a>
          <a
            href="#made-for-you"
            className="hidden min-h-11 items-center text-muted-foreground hover:text-foreground md:inline-flex"
          >
            Made for you
          </a>
          <Button asChild variant="outline">
            <a href={download || "#discover"}>
              {download ? "Get Stayzy" : "Meet Stayzy"}
              <ArrowUpRight />
            </a>
          </Button>
        </nav>
      </header>
      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-12 lg:pb-24 lg:pt-14">
          <div>
            <div className="eyebrow mb-7 flex items-center gap-2 text-primary">
              <span className="size-1.5 rounded-full bg-primary" /> A little
              company. A lot more focus.
            </div>
            <h1 className="max-w-xl text-[clamp(3.25rem,6.4vw,5.6rem)] leading-[1.04] tracking-[-.065em]">
              Find your focus.
              <br />
              <span className="font-serif font-normal italic text-primary">
                Stay with it.
              </span>
            </h1>
            <p className="mt-7 max-w-sm text-lg leading-8 text-muted-foreground">
              Big plans start with a little presence. Meet the focus companion
              that helps you show up, settle in, and keep going.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Button asChild className="min-h-13 px-7">
                <a href={download || "#discover"}>
                  {download ? "Download Stayzy" : "Discover Stayzy"}
                  <ArrowUpRight />
                </a>
              </Button>
              <span className="flex items-center gap-2 text-xs text-muted-foreground">
                <Leaf className="size-4" /> Less pressure. More presence.
              </span>
            </div>
            <div className="mt-12 flex items-center gap-3 border-t border-border pt-5 text-xs text-muted-foreground">
              <LockKeyhole className="size-4" /> Presence detection stays on
              your device.
            </div>
          </div>
          <div
            className="hero-art grain relative isolate flex min-h-[480px] items-center justify-center overflow-hidden rounded-[2rem] sm:min-h-[560px]"
            aria-label="Illustration of a Stayzy focus session"
          >
            <div className="focus-orbit size-[330px]" />
            <div className="focus-orbit size-[480px]" />
            <div className="focus-orbit size-[640px]" />
            <span className="eyebrow absolute left-7 top-7 text-[#4c7565]">
              Your space to settle in
            </span>
            <div className="relative mt-2 w-[238px] -rotate-[5deg] rounded-[36px] border-[6px] border-white bg-[#f9faf5] p-5 shadow-[12px_22px_50px_#385a4430] sm:w-[254px]">
              <div className="mx-auto mb-6 h-4 w-20 rounded-full bg-[#263b32]" />
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span>FOCUS SESSION</span>
                <span className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-primary" /> Present
                </span>
              </div>
              <div className="relative mx-auto my-6 flex size-36 flex-col items-center justify-center rounded-full border-[5px] border-[#cae9d9] border-t-primary border-r-primary">
                <span className="text-[34px] font-light tabular-nums tracking-tight">
                  24:38
                </span>
                <span className="mt-1 text-[9px] tracking-widest text-muted-foreground">
                  ONE THING AT A TIME
                </span>
              </div>
              <div className="mx-auto flex h-20 w-28 items-end justify-center">
                <div className="relative h-16 w-20 rounded-[45%_45%_35%_35%] bg-[#abc7a1] shadow-[inset_-7px_-6px_0_#95b98c]">
                  <div className="absolute left-[24px] top-6 flex gap-4">
                    <span className="h-2 w-1 rounded-full bg-[#355445]" />
                    <span className="h-2 w-1 rounded-full bg-[#355445]" />
                  </div>
                  <span className="absolute left-9 top-10 h-1.5 w-2 rounded-b-full border-b-2 border-[#355445]" />
                </div>
              </div>
              <p className="mb-5 mt-3 text-center text-[11px] text-muted-foreground">
                Right here with you.
              </p>
              <div className="flex h-10 items-center justify-center gap-2 rounded-full bg-[#e8eee4] text-[11px]">
                <Pause className="size-3" /> Take a breath
              </div>
            </div>
            <div className="absolute bottom-12 left-4 flex -rotate-3 items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 shadow-lg sm:left-6">
              <span className="flex size-8 items-center justify-center rounded-full bg-[#e6f3dc]">
                <Check className="size-4 text-primary" />
              </span>
              <div>
                <p className="text-xs font-semibold">You showed up.</p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  That’s a pretty good start.
                </p>
              </div>
            </div>
            <div className="absolute right-4 top-20 flex rotate-6 items-center gap-2 rounded-full bg-[#fbf7e8] px-3 py-2 text-[10px] shadow-sm sm:right-6">
              <Sparkles className="size-3 text-[#b59442]" /> A little
              encouragement
            </div>
            <span className="absolute bottom-5 right-6 text-[9px] tracking-widest text-[#567161]">
              A GLIMPSE OF STAYZY · ILLUSTRATION
            </span>
          </div>
        </section>
        <section
          id="discover"
          className="border-y border-border bg-[#eeeee6] px-6 py-7"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-14 gap-y-5 text-sm text-[#627165]">
            <span className="eyebrow text-[10px]">Room for your real life</span>
            <span className="flex items-center gap-2">
              <Timer className="size-4" /> Deep work
            </span>
            <span className="flex items-center gap-2">
              <Leaf className="size-4" /> Quiet study
            </span>
            <span className="flex items-center gap-2">
              <Sparkles className="size-4" /> Creative flow
            </span>
            <span className="flex items-center gap-2">
              <Check className="size-4" /> Everyday progress
            </span>
          </div>
        </section>
        <section
          id="how-it-works"
          className="mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28"
        >
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="eyebrow text-primary">
                A gentler kind of productivity
              </p>
              <h2 className="mt-4 max-w-xl text-4xl leading-tight tracking-[-.045em] sm:text-5xl">
                Less getting distracted.
                <br />
                <span className="font-serif font-normal italic">
                  More getting into it.
                </span>
              </h2>
            </div>
            <p className="max-w-xs text-sm leading-7 text-muted-foreground">
              No perfect routines required. Just a little structure, a friendly
              nudge, and space to do your thing.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                n: "01",
                icon: Eye,
                title: "Be here, effortlessly.",
                body: "Stayzy notices when you’re present and when you step away, helping your focus sessions reflect real life.",
                color: "bg-[#e5eddf]",
              },
              {
                n: "02",
                icon: AudioLines,
                title: "A companion in your corner.",
                body: "A little encouragement from your focus companion helps you settle in and return to what matters.",
                color: "bg-[#ece9df]",
              },
              {
                n: "03",
                icon: TrendingUp,
                title: "See the small wins.",
                body: "Look back on your sessions, notice your rhythms, and make room for a little more progress tomorrow.",
                color: "bg-[#dfecea]",
              },
            ].map(({ n, icon: Icon, title, body, color }) => (
              <article
                key={n}
                className="rounded-3xl border border-border bg-card p-7"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`flex size-12 items-center justify-center rounded-2xl ${color}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {n}
                  </span>
                </div>
                <h3 className="mt-10 text-xl font-medium tracking-tight">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {body}
                </p>
              </article>
            ))}
          </div>
        </section>
        <section
          id="made-for-you"
          className="mx-auto max-w-7xl px-6 pb-20 lg:px-12"
        >
          <div className="relative overflow-hidden rounded-[2rem] bg-[#203c35] px-8 py-14 text-[#f5f6e9] md:px-16">
            <Leaf
              className="absolute -right-8 -top-8 size-64 rotate-12 text-[#335347]"
              strokeWidth={0.5}
            />
            <div className="relative max-w-xl">
              <p className="eyebrow text-[#a9c8b0]">A little more present</p>
              <h2 className="mt-5 text-4xl tracking-[-.04em] sm:text-5xl">
                Your attention is yours.
                <br />
                <span className="font-serif font-normal italic text-[#c6d7b4]">
                  Make a little room for it.
                </span>
              </h2>
              <p className="mt-6 max-w-md text-sm leading-7 text-[#bed0c5]">
                Stayzy uses on-device presence detection without recording
                camera images. A thoughtful space for your next chapter,
                project, or quiet afternoon.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-8 border-[#9aae9e] bg-transparent text-[#f5f6e9] hover:bg-[#335347]"
              >
                <a href={download || "#how-it-works"}>
                  {download ? "Get Stayzy for iPhone" : "Explore how it works"}
                  {download ? <ArrowUpRight /> : <ArrowDown />}
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 border-t border-border px-6 py-8 lg:px-12">
        <Brand className="text-xl" />
        <span className="text-xs text-muted-foreground">
          Made for a more present day.
        </span>
        <Link
          href="/admin"
          className="inline-flex min-h-11 items-center gap-2 text-xs text-muted-foreground hover:text-primary"
        >
          Admin <ArrowUpRight className="size-3" />
        </Link>
      </footer>
    </>
  );
}
