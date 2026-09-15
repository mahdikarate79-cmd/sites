import type { Metadata } from "next";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://x.venify.xyz";

export const metadata: Metadata = {
  title: "About Sheytoni — شیطونی Social Community",
  description:
    "Sheytoni (شیطونی) is a social community platform on Telegram for profiles, posts, reels, messaging, and creator monetization. Learn what Sheytoni is and how it works.",
  alternates: { canonical: `${SITE_URL}/about/` },
  openGraph: {
    title: "About Sheytoni — شیطونی",
    description:
      "Sheytoni (شیطونی) is a social community platform for profiles, posts, and public discovery on Telegram.",
    url: `${SITE_URL}/about/`,
    siteName: "Sheytoni",
    images: [{ url: "/logo.png", width: 512, height: 512, alt: "Sheytoni" }],
  },
};

const FAQ = [
  {
    q: "What is Sheytoni?",
    a: "Sheytoni (شیطونی) is a social community platform delivered as a Telegram Mini App. Members create profiles, share posts and reels, follow others, chat privately, and support creators with Telegram Stars.",
  },
  {
    q: "What is the official website for Sheytoni?",
    a: "The official Sheytoni website is https://x.venify.xyz — this is not related to x.com (formerly Twitter).",
  },
  {
    q: "How do I join Sheytoni?",
    a: "Open the Sheytoni Telegram bot and tap the web app button to launch the Mini App inside Telegram.",
  },
  {
    q: "What can I do on Sheytoni?",
    a: "Publish posts with photos and videos, browse a social feed, send private messages, bookmark content, unlock paid media with Stars, and build a public profile for discovery.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-bg text-text px-4 py-8 max-w-2xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ.map(({ q, a }) => ({
              "@type": "Question",
              name: q,
              acceptedAnswer: { "@type": "Answer", text: a },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "Sheytoni",
            alternateName: ["شیطونی"],
            url: SITE_URL,
            applicationCategory: "SocialNetworkingApplication",
            operatingSystem: "Web, Telegram",
            description:
              "Sheytoni is a social community platform for profiles, posts, reels, messaging, and creator monetization.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        }}
      />

      <h1 className="text-2xl font-bold mb-2">About Sheytoni (شیطونی)</h1>
      <p className="text-text-muted mb-6 leading-relaxed">
        Sheytoni is a social community platform where members create profiles, publish posts, explore reels,
        connect through private chat, and support creators. The app runs inside Telegram as a Mini App at{" "}
        <a href={SITE_URL} className="text-[#3b82f6] underline">{SITE_URL}</a>.
      </p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Features</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
          <li>Public profiles with avatar, cover photo, bio, and follower counts</li>
          <li>Social feed with posts, likes, comments, and bookmarks</li>
          <li>Short-form video reels</li>
          <li>Private messaging with photos, videos, and albums</li>
          <li>Paid media unlocks using Telegram Stars</li>
          <li>Creator earnings, analytics, and verification badges</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Frequently asked questions</h2>
        <dl className="space-y-4">
          {FAQ.map(({ q, a }) => (
            <div key={q}>
              <dt className="font-medium text-sm">{q}</dt>
              <dd className="text-sm text-text-muted mt-1 leading-relaxed">{a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <p className="text-sm text-text-muted">
        <Link href="/" className="text-[#3b82f6] underline">Open Sheytoni app</Link>
        {" · "}
        <a href="https://t.me/SheytoniAd" className="text-[#3b82f6] underline">Support on Telegram</a>
      </p>
    </main>
  );
}
