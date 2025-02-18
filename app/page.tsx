import { FacebookAnalytics } from '@/components/facebook-analytics';

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-8 text-4xl font-bold">Facebook Page Analytics</h1>
        <FacebookAnalytics />
      </div>
    </main>
  );
}