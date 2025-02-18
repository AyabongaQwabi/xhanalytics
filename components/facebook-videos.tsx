'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { FacebookVideo } from '@/app/types/facebook';
import { getFacebookVideos, refreshAccessToken } from '@/app/lib/facebook';
import { format, formatDistance } from 'date-fns';
import {
  Play,
  Clock,
  Eye,
  ThumbsUp,
  MessageSquare,
  AlertTriangle,
} from 'lucide-react';

const VIDEO_TARGETS = {
  likes: 50,
  comments: 50,
};

export function FacebookVideos() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<FacebookVideo[]>([]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.round(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
        .toString()
        .padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const calculatePerformanceScore = (likes: number, comments: number) => {
    const likeScore = (likes / VIDEO_TARGETS.likes) * 100;
    const commentScore = (comments / VIDEO_TARGETS.comments) * 100;
    const averageScore = (likeScore + commentScore) / 2;
    return Math.round(averageScore);
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 100) return 'text-green-500';
    if (score >= 75) return 'text-yellow-500';
    return 'text-red-500';
  };

  const fetchVideos = async () => {
    setLoading(true);
    setError(null);
    try {
      const pageId = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID;
      let accessToken = process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN;

      if (!pageId || !accessToken) {
        throw new Error('Facebook credentials not configured');
      }

      try {
        const fetchedVideos = await getFacebookVideos(pageId, accessToken);
        setVideos(fetchedVideos);
      } catch (err: any) {
        if (err.message?.includes('Error validating access token')) {
          // Token expired, try to refresh
          accessToken = await refreshAccessToken(accessToken);
          const fetchedVideos = await getFacebookVideos(pageId, accessToken);
          setVideos(fetchedVideos);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching Facebook videos:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='space-y-8'>
      <Card className='p-6'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-semibold'>Top 20 Videos</h2>
          <Button
            onClick={fetchVideos}
            disabled={loading}
            className='w-full sm:w-auto'
          >
            {loading ? 'Loading...' : 'Fetch Videos'}
          </Button>
        </div>

        {error && (
          <div className='rounded-md bg-destructive/15 p-4 text-destructive mb-6'>
            {error}
          </div>
        )}

        <div className='mb-6 p-4 bg-muted rounded-lg'>
          <h3 className='text-lg font-semibold mb-2'>Performance Targets</h3>
          <div className='grid grid-cols-2 gap-4'>
            <div>
              <span className='text-sm text-muted-foreground'>
                Likes Target:
              </span>
              <span className='ml-2 font-medium'>{VIDEO_TARGETS.likes}</span>
            </div>
            <div>
              <span className='text-sm text-muted-foreground'>
                Comments Target:
              </span>
              <span className='ml-2 font-medium'>{VIDEO_TARGETS.comments}</span>
            </div>
          </div>
        </div>

        {videos.length > 0 && (
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[200px]'>Video</TableHead>
                  <TableHead>Title & Details</TableHead>
                  <TableHead className='text-right'>Duration</TableHead>
                  <TableHead className='text-right'>Views</TableHead>
                  <TableHead className='text-right'>Engagement</TableHead>
                  <TableHead className='text-right'>Performance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {videos.map((video) => {
                  const performanceScore = calculatePerformanceScore(
                    video.likes.summary.total_count,
                    video.comments.summary.total_count
                  );
                  const performanceColor =
                    getPerformanceColor(performanceScore);

                  return (
                    <TableRow key={video.id} className='group'>
                      <TableCell>
                        <div className='relative w-32 h-24 rounded-md overflow-hidden bg-muted'>
                          <img
                            src={video.picture}
                            alt={video.title || 'Video thumbnail'}
                            className='object-cover w-full h-full'
                          />
                          <div className='absolute inset-0 bg-black/40 group-hover:bg-black/60 transition-colors flex items-center justify-center'>
                            <Play className='w-8 h-8 text-white opacity-75 group-hover:opacity-100 transition-opacity' />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <h3 className='font-medium mb-1'>
                          {video.title || 'Untitled Video'}
                        </h3>
                        <p className='text-sm text-muted-foreground mb-2 line-clamp-2'>
                          {video.description || 'No description'}
                        </p>
                        <div className='text-xs text-muted-foreground'>
                          Posted {format(new Date(video.created_time), 'PPP')}
                          <br />
                          {formatDistance(
                            new Date(video.created_time),
                            new Date(),
                            {
                              addSuffix: true,
                            }
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Clock className='w-4 h-4 text-muted-foreground' />
                          <span>{formatDuration(video.length)}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Eye className='w-4 h-4 text-muted-foreground' />
                          <span>{video.views.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex justify-end gap-4'>
                          <div className='flex items-center gap-1'>
                            <ThumbsUp className='w-4 h-4 text-muted-foreground' />
                            <span
                              className={
                                video.likes.summary.total_count >=
                                VIDEO_TARGETS.likes
                                  ? 'text-green-500'
                                  : ''
                              }
                            >
                              {video.likes.summary.total_count.toLocaleString()}
                            </span>
                          </div>
                          <div className='flex items-center gap-1'>
                            <MessageSquare className='w-4 h-4 text-muted-foreground' />
                            <span
                              className={
                                video.comments.summary.total_count >=
                                VIDEO_TARGETS.comments
                                  ? 'text-green-500'
                                  : ''
                              }
                            >
                              {video.comments.summary.total_count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className={`font-bold ${performanceColor}`}>
                          {performanceScore}%
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
