import { FacebookVideos } from '@/components/facebook-videos';

export default function VideosPage() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold">Facebook Video Analytics</h1>
        <FacebookVideos />
      </div>
    </main>
  );
}