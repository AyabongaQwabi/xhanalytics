'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getPageInsights, refreshAccessToken } from '@/app/lib/facebook';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Users, TrendingUp, Globe, MapPin } from 'lucide-react';

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEEAD',
  '#D4A5A5',
  '#9A8C98',
  '#C3B299',
];

export function FacebookInsight() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [formattedData, setFormattedData] = useState<any[]>([]);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    setError(null);
    try {
      const pageId = process.env.NEXT_PUBLIC_FACEBOOK_PAGE_ID;
      let accessToken = process.env.NEXT_PUBLIC_FACEBOOK_ACCESS_TOKEN;

      if (!pageId || !accessToken) {
        throw new Error('Facebook credentials not configured');
      }

      try {
        const insightData = await getPageInsights(pageId, accessToken);
        setData(insightData.data);
      } catch (err: any) {
        if (err.message?.includes('Error validating access token')) {
          accessToken = await refreshAccessToken(accessToken);
          const insightData = await getPageInsights(pageId, accessToken);
          setData(insightData.data);
        } else {
          throw err;
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching Facebook insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data?.data) {
      const transformed = data.data[0].values.map((entry, index) => {
        const dataPoint = {
          date: new Date(entry.end_time).toLocaleDateString(),
        };
        data.data.forEach((metric) => {
          const value = metric.values[index]?.value;
          dataPoint[metric.name] =
            typeof value === 'object'
              ? Object.values(value).reduce((a, b) => a + b, 0)
              : value;
        });
        return dataPoint;
      });
      setFormattedData(transformed);
    }
  }, [data]);

  return (
    <div className='space-y-8'>
      <Card className='p-6'>
        <h2 className='text-xl font-bold mb-4'>Facebook Insights</h2>
        {loading && <p>Loading...</p>}
        {error && <p className='text-red-500'>{error}</p>}

        {!loading && !error && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {data.map((metric, index) => (
              <div key={index} className='p-4 border rounded-lg shadow-md'>
                <h3 className='font-semibold text-lg'>
                  {metric.title || metric.name}
                </h3>
                <p className='text-sm text-gray-600 py-4'>
                  {metric.description}
                </p>
                <ResponsiveContainer width='100%' height={200}>
                  <LineChart
                    data={metric.values.map((v) => ({
                      time: v.end_time,
                      value: v.value,
                    }))}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='time' hide />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='value'
                      stroke={COLORS[index % COLORS.length]}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        )}
        <Button onClick={fetchInsights} className='mt-4'>
          Refresh Data
        </Button>
      </Card>
    </div>
  );
}
