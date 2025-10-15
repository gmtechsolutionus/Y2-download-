import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url, quality = '720' } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Use multiple services to get download links
    const downloadData = await getDownloadLinks(videoId, quality);
    
    return NextResponse.json(downloadData);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ 
      error: 'Failed to get download links',
      fallback: true 
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
    if (match) return match[1];
  }
  
  return null;
}

async function getDownloadLinks(videoId: string, quality: string) {
  const services = [
    {
      name: 'Y2Mate',
      getUrl: () => `https://www.y2mate.com/youtube/${videoId}`,
      type: 'redirect'
    },
    {
      name: 'SaveFrom',
      getUrl: () => `https://en.savefrom.net/1-youtube-video-downloader-${videoId}.html`,
      type: 'redirect'
    },
    {
      name: 'KeepVid',
      getUrl: () => `https://keepvid.com/?url=https://www.youtube.com/watch?v=${videoId}`,
      type: 'redirect'
    },
    {
      name: '9xbuddy',
      getUrl: () => `https://9xbuddy.org/process?url=https://www.youtube.com/watch?v=${videoId}`,
      type: 'redirect'
    }
  ];

  // Get video info first
  try {
    const infoResponse = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`);
    const videoInfo = await infoResponse.json();
    
    return {
      success: true,
      videoInfo: {
        title: videoInfo.title || 'Unknown Title',
        author: videoInfo.author_name || 'Unknown Author',
        thumbnail: videoInfo.thumbnail_url || ''
      },
      downloadLinks: services.map(service => ({
        service: service.name,
        url: service.getUrl(),
        type: service.type,
        quality: quality
      })),
      directDownload: {
        available: false,
        message: 'Use one of the external services above for direct MP4 download'
      }
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to fetch video information',
      downloadLinks: services.map(service => ({
        service: service.name,
        url: service.getUrl(),
        type: service.type
      }))
    };
  }
}