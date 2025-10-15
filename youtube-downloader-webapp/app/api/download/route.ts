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

    // Get video info and download links
    const videoData = await getVideoData(videoId);
    
    return NextResponse.json(videoData);
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

async function getVideoData(videoId: string) {
  try {
    // Using multiple APIs to ensure reliability
    
    // First, try to get video info from noembed
    const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    const infoResponse = await fetch(noembedUrl);
    const videoInfo = await infoResponse.json();
    
    if (!videoInfo.title) {
      throw new Error('Video not found');
    }
    
    // Get download links using a public API
    // Using cobalt.tools API which is a reliable YouTube downloader
    const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: `https://www.youtube.com/watch?v=${videoId}`,
        vCodec: 'h264',
        vQuality: '720',
        aFormat: 'mp3',
        filenamePattern: 'pretty',
        isAudioOnly: false,
        disableMetadata: false
      })
    });

    let downloadData = { url: null };
    if (cobaltResponse.ok) {
      const cobaltData = await cobaltResponse.json();
      if (cobaltData.status === 'stream') {
        downloadData.url = cobaltData.url;
      }
    }

    // Alternative: Use another service
    if (!downloadData.url) {
      // Try AllTube API
      const alltubeUrl = `https://alltubedownload.net/json?url=https://www.youtube.com/watch?v=${videoId}`;
      const alltubeResponse = await fetch(alltubeUrl);
      
      if (alltubeResponse.ok) {
        const alltubeData = await alltubeResponse.json();
        if (alltubeData.formats && alltubeData.formats.length > 0) {
          // Find best MP4 format
          const mp4Format = alltubeData.formats.find((f: any) => 
            f.ext === 'mp4' && f.vcodec !== 'none'
          ) || alltubeData.formats[0];
          
          downloadData.url = mp4Format.url;
        }
      }
    }
    
    return {
      title: videoInfo.title,
      author: videoInfo.author_name,
      thumbnail: videoInfo.thumbnail_url,
      videoId: videoId,
      downloadUrl: downloadData.url,
      // Fallback download options
      alternativeDownloads: [
        {
          service: 'Y2Mate',
          url: `https://www.y2mate.com/youtube/${videoId}`
        },
        {
          service: 'SaveFrom',
          url: `https://www.ssyoutube.com/watch?v=${videoId}`
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching video data:', error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('videoId');
  const download = searchParams.get('download');
  
  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    // For direct download endpoint
    if (download === 'true') {
      // Redirect to a reliable download service
      const downloadUrl = `https://www.y2mate.com/youtube/${videoId}`;
      return NextResponse.redirect(downloadUrl);
    }
    
    // Return video info
    const videoData = await getVideoData(videoId);
    return NextResponse.json(videoData);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}