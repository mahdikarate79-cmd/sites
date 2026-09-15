import { AppLayout } from "@/components/layout/AppLayout";
import { FeedList } from "@/components/feed/FeedList";

export default function HomePage() {
  return (
    <AppLayout>
      <section className="sr-only" aria-label="About Sheytoni">
        <h1>Sheytoni — شیطونی Social Community</h1>
        <p>
          Sheytoni is a social community platform at x.venify.xyz for profiles, posts, reels,
          private messaging, and creator monetization via Telegram Stars. Visit our about page for more.
        </p>
      </section>
      <FeedList />
    </AppLayout>
  );
}
