import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  LockKeyhole,
  Music2,
  Pencil,
  Sparkles,
} from "lucide-react";
import { AppTour } from "@/components/site/app-tour";
import { Brand } from "@/components/site/brand";
import { HeroPreview } from "@/components/site/hero-preview";
import { ThemeToggle } from "@/components/site/theme-toggle";

const defaultAppStoreUrl = "https://apps.apple.com/us/app/stayzy/id6808848074";
function appStoreUrl() {
  try {
    const url = new URL(process.env.STAYZY_APP_STORE_URL || defaultAppStoreUrl);
    return url.protocol === "https:" && url.hostname === "apps.apple.com"
      ? url.href
      : defaultAppStoreUrl;
  } catch {
    return defaultAppStoreUrl;
  }
}

export default function Home() {
  const download = appStoreUrl();
  return (
    <div className="marketing-site">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="site-header site-container">
        <Brand />
        <nav aria-label="Main navigation">
          <a href="#how-it-works" className="nav-link">
            How it works
          </a>
          <a href="#made-for-you" className="nav-link">
            Made for you
          </a>
          <ThemeToggle />
          <a className="site-button site-button-small" href={download}>
            Get Stayzy <ArrowUpRight size={16} />
          </a>
        </nav>
      </header>
      <main id="main-content">
        <section className="hero site-container" aria-labelledby="hero-heading">
          <div className="hero-copy">
            <h1 id="hero-heading">
              A little company.
              <br />
              <span>A little more focus.</span>
            </h1>
            <p>
              A friendly companion for reading, homework, and piano practice.
              Make a small start, and see your progress.
            </p>
            <div className="hero-actions">
              <a className="site-button" href={download}>
                Get Stayzy <ArrowUpRight size={18} />
              </a>
              <a className="text-link" href="#how-it-works">
                Explore the app <ArrowRight size={18} />
              </a>
            </div>
          </div>
          <HeroPreview />
        </section>
        <section
          id="discover"
          className="discovery-strip"
          aria-label="Made for everyday focus"
        >
          <div className="site-container discovery-content">
            <span>Make room for what matters.</span>
            <div>
              <BookOpen size={19} /> Reading
            </div>
            <div>
              <Pencil size={19} /> Homework
            </div>
            <div>
              <Music2 size={19} /> Piano practice
            </div>
            <div>
              <Sparkles size={19} /> Your next small start
            </div>
          </div>
        </section>
        <AppTour />
        <section
          id="made-for-you"
          className="site-container privacy-section"
          aria-labelledby="privacy-heading"
        >
          <div className="privacy-content">
            <span className="privacy-icon">
              <LockKeyhole size={26} strokeWidth={1.8} />
            </span>
            <h2 id="privacy-heading">Your attention is yours.</h2>
            <p>
              Stayzy uses on-device presence detection without recording camera
              images. Make room for your next chapter, project, or quiet
              afternoon.
            </p>
            <a className="text-link" href="/privacy">
              Read our privacy policy <ArrowUpRight size={18} />
            </a>
          </div>
          <div className="companion-art">
            <Image
              src="/marketing/companions-scene.png"
              alt="Stayzy’s cheerful teal, pink heart, and orange companions together"
              width={1536}
              height={1024}
              sizes="(max-width: 767px) 90vw, 500px"
            />
          </div>
        </section>
        <section
          className="closing-section site-container"
          aria-labelledby="closing-heading"
        >
          <h2 id="closing-heading">Small starts add up.</h2>
          <p>Your next focus session starts with a little company.</p>
          <a className="site-button" href={download}>
            Get Stayzy <ArrowUpRight size={18} />
          </a>
        </section>
      </main>
      <footer className="site-footer site-container">
        <Brand />
        <span>Made for a more present day.</span>
        <Link href="/privacy">Privacy policy</Link>
        <Link href="/admin">
          Admin <ArrowUpRight size={14} />
        </Link>
      </footer>
    </div>
  );
}
