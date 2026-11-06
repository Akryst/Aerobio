import RecentTracks from "@/components/RecentTracks";
import ProfileCard from "@/components/ProfileCard";
import AboutSection from "@/components/AboutSection";
import AnonymousWall from "@/components/AnonymousWall";
import WindowTitle from "@/components/WindowTitle";

export default function Home() {
  return (
    <div className="mx-auto min-h-svh w-full max-w-6xl px-3 py-10 sm:px-6 lg:pt-[clamp(4rem,10svh,7rem)]">
      <main className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4">
          <ProfileCard />
          <AnonymousWall />
        </div>
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <section id="music" aria-labelledby="music-title" className="window active glass">
            <WindowTitle id="music-title" icon="music">Windows Media Player</WindowTitle>
            <div className="window-body">
              <RecentTracks />
            </div>
            <div className="status-bar">
              <p className="status-bar-field">Recently played · Last.fm</p>
            </div>
          </section>
          <AboutSection />
        </div>
      </main>
    </div>
  );
}
