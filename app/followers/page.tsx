import { FacebookInsight } from '@/components/facebook-followers';

export default function FollowersPage() {
  return (
    <main className='min-h-screen bg-background p-8'>
      <div className='mx-auto max-w-7xl'>
        <h1 className='mb-8 text-4xl font-bold'>Audience Insights</h1>
        <FacebookInsight />
      </div>
    </main>
  );
}
