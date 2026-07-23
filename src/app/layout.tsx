import type { Metadata, Viewport } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import { Providers } from "./providers";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Peony — a calm place to plan your days",
    template: "%s · Peony",
  },
  description:
    "A soft, unhurried planner for days, weeks and months. Tasks, habits, goals, notes and reflections in one quiet place.",
  applicationName: "Peony",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfafb" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1216" },
  ],
};

/** Applies the saved theme before first paint so dark mode never flashes white. */
const THEME_BOOTSTRAP = `
(function(){try{
  var t = localStorage.getItem('peony.theme');
  var m = localStorage.getItem('peony.motion');
  document.documentElement.dataset.theme = t === 'dark' ? 'dark' : 'light';
  if (m === 'calm') document.documentElement.dataset.motion = 'calm';
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The font variables live on <html> so the :root token layer can resolve them.
    <html
      lang="en"
      data-theme="light"
      className={`${fraunces.variable} ${jakarta.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <Script id="peony-theme" strategy="beforeInteractive">
          {THEME_BOOTSTRAP}
        </Script>
      </head>
      <body className="min-h-full antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
