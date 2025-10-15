import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract video ID from YouTube URL
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Get video info using a public API
    const videoInfo = await getVideoInfo(videoId);
    
    return NextResponse.json(videoInfo);
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Failed to process video' }, { status: 500 });
  }
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

async function getVideoInfo(videoId: string) {
  // Using a public API to get video info
  const apiUrl = `https://youtube-video-download-info.p.rapidapi.com/dl?id=${videoId}`;
  
  // Note: In production, you should use environment variables for API keys
  // For this demo, we'll use a free tier approach
  try {
    // Alternative approach using noembed
    const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(noembedUrl);
    const data = await response.json();
    
    if (!data.title) {
      throw new Error('Video not found');
    }
    
    // Return basic info and download links
    return {
      title: data.title,
      author: data.author_name,
      thumbnail: data.thumbnail_url,
      videoId: videoId,
      // For actual downloads, we'll provide YouTube's direct links
      downloadLinks: [
        {
          quality: 'HD',
          format: 'mp4',
          url: `https://www.y2mate.com/mates/en68/analyze?url=https://www.youtube.com/watch?v=${videoId}&ajax=1`
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching video info:', error);
    throw error;
  }
}