import Link from "next/link";
import Image from "next/image";
import { AppTour } from "@/components/site/app-tour";
import {
  ArrowDown,
  ArrowUpRight,
  Check,
  Leaf,
  LockKeyhole,
  Sparkles,
  Timer,
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
            <a href={download || "#how-it-works"}>
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
            <h1 className="max-w-xl text-[clamp(2.8rem,5.4vw,4.7rem)] leading-[1.04] tracking-[-.065em]">
              More studying.
              <br />
              <span className="font-serif font-normal italic text-primary">
                Less clock-watching.
              </span>
            </h1>
            <p className="mt-7 max-w-sm text-lg leading-8 text-muted-foreground">
              Stayzy tracks the time you’re present, so you can stay with the
              work in front of you. Set a goal, meet your companion, and make
              room for a calmer study session.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-5">
              <Button asChild className="min-h-13 px-7">
                <a href={download || "#how-it-works"}>
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
          <div className="relative isolate flex min-h-[560px] items-center justify-center overflow-hidden rounded-[2rem] bg-[#eae6fa] py-10 sm:min-h-[640px]">
            <div className="absolute -bottom-32 -right-28 size-96 rounded-full bg-[#b9e7df] blur-2xl" />
            <span className="eyebrow absolute left-7 top-6 text-[#5b527c]">
              A little company goes a long way
            </span>
            <Image
              src="/marketing/active.png"
              alt="Stayzy reading session with a purple companion and separate present, away, break, and elapsed time counters"
              width={1320}
              height={2868}
              sizes="(max-width: 640px) 230px, 260px"
              preload
              className="relative mt-5 w-[230px] -rotate-3 rounded-[2rem] border-[5px] border-white shadow-[0_24px_60px_#40376530] sm:w-[260px]"
            />
            <a
              href="#how-it-works"
              className="absolute bottom-7 right-5 flex min-h-12 items-center gap-3 rounded-full bg-white px-5 text-sm font-medium shadow-lg transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Take a look inside <ArrowDown className="size-4" />
            </a>
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
        <AppTour />
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
        <Link
          href="/privacy"
          className="inline-flex min-h-11 items-center rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          Privacy policy
        </Link>
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
