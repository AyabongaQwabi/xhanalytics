import {
  FacebookPost,
  FacebookInsights,
  FacebookVideo,
} from '@/app/types/facebook';
import axios from 'axios';
const FACEBOOK_API_VERSION = 'v19.0';
const FACEBOOK_API_BASE_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;
const APP_ID = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID;
const APP_SECRET = process.env.FACEBOOK_CLIENT_SECRET;

export async function refreshAccessToken(
  currentToken: string
): Promise<string> {
  const url = `${FACEBOOK_API_BASE_URL}/oauth/access_token`;
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: APP_ID,
    client_secret: APP_SECRET,
    fb_exchange_token: currentToken,
  });

  const response = await fetch(`${url}?${params}`);
  if (!response.ok) {
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  return data.access_token;
}

export async function getPageInsights(
  pageId: string,
  accessToken: string
): Promise<FacebookInsights> {
  // Get insights data
  const insightsUrl = `${FACEBOOK_API_BASE_URL}/${pageId}/insights`;
  const insightsParams = new URLSearchParams({
    access_token: accessToken,
    metric: [
      'page_total_actions	',
      'page_daily_follows_unique',
      'page_daily_unfollows_unique',
      'page_daily_follows_unique',
      'page_post_engagements',
      'page_posts_impressions',
      'page_lifetime_engaged_followers_unique',
      'page_daily_follows_unique',
      'page_follows',
      'page_impressions_unique',
      'creator_monetization_qualified_views',
      'post_video_ad_break_earnings',
      'post_video_ad_break_ad_impressions',
      'page_video_views',
    ].join(','),
    period: 'day',
  });

  console.log(`${insightsUrl}?${insightsParams}`);
  const insightsResponse = await fetch(`${insightsUrl}?${insightsParams}`);
  if (!insightsResponse.ok) {
    throw new Error('Failed to fetch Facebook insights data');
  }
  const insightsData = await insightsResponse.json();
  console.log('insightsData:', insightsData);
  return insightsData;
}

export async function getInsights(
  pageId: string,
  accessToken: string
): Promise<FacebookFollowers> {
  // Get page information
  const pageUrl = `${FACEBOOK_API_BASE_URL}/${pageId}/insights/page_impressions_unique`;

  const pageResponse = await fetch(`${pageUrl}`);
  if (!pageResponse.ok) {
    console.log('Failed to fetch Facebook page data:', pageResponse);
    throw new Error('Failed to fetch Facebook page data');
  }
  const pageData = await pageResponse.json();
  const insightsData = pageData.data;
  console.log('insightsData:', insightsData);
  return insightsData;
}

export async function getFacebookPosts(
  pageId: string,
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<FacebookPost[]> {
  const since = Math.floor(startDate.getTime() / 1000);
  const until = Math.floor(endDate.getTime() / 1000);

  const url = `${FACEBOOK_API_BASE_URL}/${pageId}/posts`;
  const params = new URLSearchParams({
    access_token: accessToken,
    fields:
      'id,message,created_time,admin_creator{name,id},from{name,id},likes.summary(true),comments.summary(true),shares,insights.metric(post_impressions,post_engagements)',
    since: since.toString(),
    until: until.toString(),
  });

  const fullUrl = `${url}?${params}`;
  console.log('Fetching Facebook posts:', fullUrl);
  const response = await fetch(fullUrl);
  console.log('Response:', response);
  if (!response.ok) {
    console.log('Failed to fetch Facebook posts:', response.data);
    //throw new Error('Failed to fetch Facebook posts');
  }

  const data = await response.json();
  return data.data;
}

export async function getFacebookVideos(
  pageId: string,
  accessToken: string,
  limit: number = 20
): Promise<FacebookVideo[]> {
  const url = `${FACEBOOK_API_BASE_URL}/${pageId}/videos`;
  const params = new URLSearchParams({
    access_token: accessToken,
    fields:
      'id,title,description,created_time,updated_time,length,views,likes.summary(true),comments.summary(true),source,picture,insights.metric(total_video_views,total_video_view_time,total_video_views_unique,total_video_views_autoplayed,total_video_complete_views,total_video_views_clicked_to_play)',
    limit: limit.toString(),
  });

  const fullUrl = `${url}?${params}`;
  const response = await fetch(fullUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch Facebook videos');
  }

  const data = await response.json();
  return data.data;
}
