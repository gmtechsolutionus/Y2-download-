import { NextRequest, NextResponse } from 'next/server';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || 'demo-key';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Method 1: Try using a public API that doesn't require authentication
    try {
      const response = await fetch(`https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${videoId}`, {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'youtube-media-downloader.p.rapidapi.com'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok' && data.videos) {
          return NextResponse.json({
            success: true,
            title: data.title,
            author: data.author,
            thumbnail: data.thumbnail,
            formats: data.videos.items.filter((item: any) => 
              item.extension === 'mp4' && item.hasAudio
            ).map((item: any) => ({
              quality: item.quality,
              url: item.url,
              size: item.size
            }))
          });
        }
      }
    } catch (error) {
      console.log('RapidAPI method failed, trying alternative...');
    }

    // Method 2: Use a scraping approach with public endpoints
    const videoInfo = await getVideoInfoAlternative(videoId);
    return NextResponse.json(videoInfo);
    
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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

async function getVideoInfoAlternative(videoId: string) {
  // Use YouTube's oEmbed API for basic info
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const response = await fetch(oembedUrl);
  const data = await response.json();
  
  return {
    success: true,
    title: data.title,
    author: data.author_name,
    thumbnail: data.thumbnail_url,
    videoId: videoId,
    // Provide multiple download options
    downloadOptions: [
      {
        method: 'external',
        quality: 'HD',
        url: `https://www.yt2mate.com/youtube-downloader/${videoId}`,
        instructions: 'Click to open external downloader'
      },
      {
        method: 'proxy',
        quality: 'Multiple',
        url: `/api/proxy-download?v=${videoId}`,
        instructions: 'Use proxy downloader'
      }
    ]
  };
}