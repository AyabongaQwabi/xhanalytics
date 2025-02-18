'use client';

import { useState, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DateRange, FacebookPost, Performance } from '@/app/types/facebook';
import { getFacebookPosts } from '@/app/lib/facebook';
import { format, subMonths, formatDistance, differenceInDays } from 'date-fns';

const DAILY_TARGETS = {
  posts: 15,
  likes: 600,
  comments: 300,
  shares: 100,
};

const CHART_COLORS = {
  likes: '#007AFF', // Bright Blue
  comments: '#FF9500', // Bright Orange
  shares: '#34C759', // Bright Green
  posts: '#8E8E93', // Gray
  target: '#FF2D55', // Bright Pink
  success: '#34C759', // Green
  warning: '#FF9500', // Orange
  error: '#FF3B30', // Red
};

const getPerformanceColor = (value: number, target: number) => {
  const ratio = value / target;
  if (ratio >= 1) return CHART_COLORS.success;
  if (ratio >= 0.8) return CHART_COLORS.warning;
  return CHART_COLORS.error;
};

export function FacebookAnalytics() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [posts, setPosts] = useState<FacebookPost[]>([]);
  const [performance, setPerformance] = useState<Performance | null>(null);

  const topPosts = useMemo(() => {
    if (!posts.length) return { byLikes: [], byComments: [], byShares: [] };

    const sortedByLikes = [...posts]
      .sort(
        (a, b) =>
          (b.likes?.summary?.total_count || 0) -
          (a.likes?.summary?.total_count || 0)
      )
      .slice(0, 5);

    const sortedByComments = [...posts]
      .sort(
        (a, b) =>
          (b.comments?.summary?.total_count || 0) -
          (a.comments?.summary?.total_count || 0)
      )
      .slice(0, 5);

    const sortedByShares = [...posts]
      .sort((a, b) => (b.shares?.count || 0) - (a.shares?.count || 0))
      .slice(0, 5);

    return {
      byLikes: sortedByLikes,
      byComments: sortedByComments,
      byShares: sortedByShares,
    };
  }, [posts]);

  const calculatePerformance = (chartData: any[]): Performance => {
    const totalDays = differenceInDays(dateRange.to, dateRange.from) + 1;

    const totals = chartData.reduce(
      (acc, day) => ({
        likes: acc.likes + day.likes,
        comments: acc.comments + day.comments,
        shares: acc.shares + (day.shares || 0),
        posts: acc.posts + day.postCount,
      }),
      { likes: 0, comments: 0, shares: 0, posts: 0 }
    );

    const periodTargets = {
      likes: DAILY_TARGETS.likes * totalDays,
      comments: DAILY_TARGETS.comments * totalDays,
      shares: DAILY_TARGETS.shares * totalDays,
      posts: DAILY_TARGETS.posts * totalDays,
    };

    const scores = {
      likes: totals.likes / periodTargets.likes,
      comments: totals.comments / periodTargets.comments,
      shares: totals.shares / periodTargets.shares,
      posts: totals.posts / periodTargets.posts,
    };

    const overallScore =
      Object.values(scores).reduce((a, b) => a + b, 0) /
      Object.keys(scores).length;

    return {
      totals,
      periodTargets,
      scores,
      overallScore,
    };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const pageId = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID;
      const accessToken = process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN;

      if (!pageId || !accessToken) {
        throw new Error('Facebook credentials not configured');
      }

      console.log('Fetching Facebook data:', pageId, accessToken, dateRange);

      const fetchedPosts = await getFacebookPosts(
        pageId,
        accessToken,
        dateRange.from,
        dateRange.to
      );

      setPosts(fetchedPosts);

      const sortedPosts = [...fetchedPosts].sort(
        (a, b) =>
          new Date(a.created_time).getTime() -
          new Date(b.created_time).getTime()
      );

      const postsByDate = sortedPosts.reduce((acc, post) => {
        const date = format(new Date(post.created_time), 'MMM dd');
        if (!acc[date]) {
          acc[date] = {
            posts: [],
            likes: 0,
            comments: 0,
            shares: 0,
          };
        }
        acc[date].posts.push(post);
        acc[date].likes += post.likes?.summary?.total_count ?? 0;
        acc[date].comments += post.comments?.summary?.total_count ?? 0;
        acc[date].shares += post.shares?.count ?? 0;
        return acc;
      }, {} as Record<string, { posts: FacebookPost[]; likes: number; comments: number; shares: number }>);

      const chartData = Object.entries(postsByDate).map(([date, metrics]) => ({
        date,
        postCount: metrics.posts.length,
        likes: metrics.likes,
        comments: metrics.comments,
        shares: metrics.shares,
      }));

      setData(chartData);
      setPerformance(calculatePerformance(chartData));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching Facebook data:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const chartProps = {
    width: '100%',
    height: '100%',
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  };

  const xAxisProps = {
    dataKey: 'date',
    fontSize: 12,
    padding: { left: 10, right: 10 },
    height: 60,
    tickMargin: 10,
  };

  const yAxisProps = {
    fontSize: 12,
    width: 80,
    tickMargin: 10,
  };

  const lineProps = {
    strokeWidth: 2,
    dot: { strokeWidth: 2, r: 4 },
  };

  return (
    <div className='space-y-8'>
      <Card className='p-6'>
        <h2 className='mb-4 text-2xl font-semibold'>Select Date Range</h2>
        <div className='flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0'>
          <Calendar
            mode='range'
            selected={{
              from: dateRange.from,
              to: dateRange.to,
            }}
            onSelect={(range) => {
              if (range?.from) {
                setDateRange((prev) => ({
                  from: range.from!,
                  to: range.to || prev.to,
                }));
              }
            }}
            fromDate={subMonths(new Date(), 24)}
            toDate={new Date()}
            className='rounded-md border'
            defaultMonth={dateRange.from}
          />
          <div className='flex flex-col justify-end'>
            <Button
              onClick={fetchData}
              disabled={loading}
              className='w-full sm:w-auto'
            >
              {loading ? 'Loading...' : 'Fetch Data'}
            </Button>
          </div>
        </div>
      </Card>

      {error && (
        <div className='rounded-md bg-destructive/15 p-4 text-destructive'>
          {error}
        </div>
      )}

      {performance && (
        <Card className='p-6 bg-gradient-to-r from-primary/5 to-primary/10'>
          <h2 className='mb-6 text-3xl font-bold text-center'>
            Performance Summary
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {Object.entries(performance.totals).map(([metric, value]) => (
              <div
                key={metric}
                className='p-4 bg-background rounded-lg shadow-sm border'
                style={{
                  borderColor: getPerformanceColor(
                    value as number,
                    performance.periodTargets[
                      metric as keyof typeof performance.periodTargets
                    ]
                  ),
                }}
              >
                <h3 className='text-lg font-semibold capitalize mb-2'>
                  {metric}
                </h3>
                <div className='flex justify-between items-baseline'>
                  <span className='text-2xl font-bold'>
                    {Math.round(value as number).toLocaleString()}
                  </span>
                  <span className='text-sm text-muted-foreground'>
                    Target:{' '}
                    {performance.periodTargets[
                      metric as keyof typeof performance.periodTargets
                    ].toLocaleString()}
                  </span>
                </div>
                <div className='mt-2 text-sm'>
                  {(
                    ((value as number) /
                      performance.periodTargets[
                        metric as keyof typeof performance.periodTargets
                      ]) *
                    100
                  ).toFixed(1)}
                  % of target
                </div>
              </div>
            ))}
          </div>
          <div className='mt-6 text-center'>
            <div className='text-4xl font-bold mb-2'>
              Overall Performance Score
            </div>
            <div
              className='text-6xl font-black'
              style={{
                color: getPerformanceColor(performance.overallScore * 100, 100),
              }}
            >
              {Math.round(performance.overallScore * 100)}%
            </div>
          </div>
        </Card>
      )}

      {data.length > 0 && (
        <>
          <Card className='p-6'>
            <h2 className='mb-4 text-2xl font-semibold'>
              Engagement Metrics vs Targets
            </h2>
            <div className='text-sm text-muted-foreground mb-2'>
              Daily Targets: {DAILY_TARGETS.likes.toLocaleString()} likes,{' '}
              {DAILY_TARGETS.comments.toLocaleString()} comments,{' '}
              {DAILY_TARGETS.shares.toLocaleString()} shares
            </div>
            <div className='h-[400px] w-full'>
              <ResponsiveContainer {...chartProps}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine
                    y={DAILY_TARGETS.likes}
                    stroke={CHART_COLORS.target}
                    strokeDasharray='3 3'
                    label='Likes Target'
                  />
                  <ReferenceLine
                    y={DAILY_TARGETS.comments}
                    stroke={CHART_COLORS.target}
                    strokeDasharray='3 3'
                    label='Comments Target'
                  />
                  <ReferenceLine
                    y={DAILY_TARGETS.shares}
                    stroke={CHART_COLORS.target}
                    strokeDasharray='3 3'
                    label='Shares Target'
                  />
                  <Line
                    type='monotone'
                    dataKey='likes'
                    stroke={CHART_COLORS.likes}
                    name='Likes'
                    {...lineProps}
                  />
                  <Line
                    type='monotone'
                    dataKey='comments'
                    stroke={CHART_COLORS.comments}
                    name='Comments'
                    {...lineProps}
                  />
                  <Line
                    type='monotone'
                    dataKey='shares'
                    stroke={CHART_COLORS.shares}
                    name='Shares'
                    {...lineProps}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className='p-6'>
            <h2 className='mb-4 text-2xl font-semibold'>
              Daily Post Count vs Target
            </h2>
            <div className='text-sm text-muted-foreground mb-2'>
              Daily Target: {DAILY_TARGETS.posts} posts
            </div>
            <div className='h-[400px] w-full'>
              <ResponsiveContainer {...chartProps}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis {...xAxisProps} />
                  <YAxis {...yAxisProps} />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine
                    y={DAILY_TARGETS.posts}
                    stroke={CHART_COLORS.target}
                    strokeDasharray='3 3'
                    label='Posts Target'
                  />
                  <Bar dataKey='postCount' name='Posts'>
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={getPerformanceColor(
                          entry.postCount,
                          DAILY_TARGETS.posts
                        )}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className='p-6'>
            <h2 className='mb-4 text-2xl font-semibold'>
              Top Performing Posts
            </h2>
            <div className='space-y-8'>
              <div>
                <h3 className='text-xl font-semibold mb-4'>
                  Top Posts by Likes
                </h3>
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[200px]'>Date</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className='text-right'>Likes</TableHead>
                        <TableHead className='text-right'>Comments</TableHead>
                        <TableHead className='text-right'>Shares</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPosts.byLikes.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className='font-medium'>
                            {format(new Date(post.created_time), 'PPP')}
                          </TableCell>
                          <TableCell className='max-w-[300px] truncate'>
                            {post.message || 'No message'}
                          </TableCell>
                          <TableCell className='text-right font-bold'>
                            {post.likes?.summary?.total_count?.toLocaleString() ??
                              0}
                          </TableCell>
                          <TableCell className='text-right'>
                            {post.comments?.summary?.total_count?.toLocaleString() ??
                              0}
                          </TableCell>
                          <TableCell className='text-right'>
                            {post.shares?.count?.toLocaleString() ?? 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className='text-xl font-semibold mb-4'>
                  Top Posts by Comments
                </h3>
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[200px]'>Date</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className='text-right'>Likes</TableHead>
                        <TableHead className='text-right'>Comments</TableHead>
                        <TableHead className='text-right'>Shares</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPosts.byComments.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className='font-medium'>
                            {format(new Date(post.created_time), 'PPP')}
                          </TableCell>
                          <TableCell className='max-w-[300px] truncate'>
                            {post.message || 'No message'}
                          </TableCell>
                          <TableCell className='text-right'>
                            {post.likes?.summary?.total_count?.toLocaleString() ??
                              0}
                          </TableCell>
                          <TableCell className='text-right font-bold'>
                            {post.comments?.summary?.total_count?.toLocaleString() ??
                              0}
                          </TableCell>
                          <TableCell className='text-right'>
                            {post.shares?.count?.toLocaleString() ?? 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h3 className='text-xl font-semibold mb-4'>
                  Top Posts by Shares
                </h3>
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-[200px]'>Date</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead className='text-right'>Likes</TableHead>
                        <TableHead className='text-right'>Comments</TableHead>
                        <TableHead className='text-right'>Shares</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topPosts.byShares.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell className='font-medium'>
                            {format(new Date(post.created_time), 'PPP')}
                          </TableCell>
                          <TableCell className='max-w-[300px] truncate'>
                            {post.message || 'No message'}
                          </TableCell>
                          <TableCell className='text-right'>
                            {post.likes?.summary?.total_count?.toLocaleString() ??
                              0}
                          </TableCell>
                          <TableCell className='text-right'>
                            {post.comments?.summary?.total_count?.toLocaleString() ??
                              0}
                          </TableCell>
                          <TableCell className='text-right font-bold'>
                            {post.shares?.count?.toLocaleString() ?? 0}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </Card>

          <Card className='p-6'>
            <h2 className='mb-4 text-2xl font-semibold'>All Posts</h2>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[200px]'>Date</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead className='text-right'>Likes</TableHead>
                    <TableHead className='text-right'>Comments</TableHead>
                    <TableHead className='text-right'>Shares</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className='font-medium'>
                        {format(new Date(post.created_time), 'PPP')}
                        <br />
                        <span className='text-sm text-muted-foreground'>
                          {formatDistance(
                            new Date(post.created_time),
                            new Date(),
                            { addSuffix: true }
                          )}
                        </span>
                      </TableCell>
                      <TableCell className='max-w-[300px] truncate'>
                        {post.message || 'No message'}
                      </TableCell>
                      <TableCell className='text-right'>
                        {post.likes?.summary?.total_count?.toLocaleString() ??
                          0}
                      </TableCell>
                      <TableCell className='text-right'>
                        {post.comments?.summary?.total_count?.toLocaleString() ??
                          0}
                      </TableCell>
                      <TableCell className='text-right'>
                        {post.shares?.count?.toLocaleString() ?? 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
