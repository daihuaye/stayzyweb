import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "Stayzy — Find your focus. Stay with it.",
    template: "%s · Stayzy",
  },
  description:
    "A little presence. A little encouragement. A calmer way to focus with Stayzy, your presence-aware focus companion.",
  openGraph: {
    title: "Stayzy — Find your focus. Stay with it.",
    description: "Make room for what matters. Meet your new focus companion.",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
