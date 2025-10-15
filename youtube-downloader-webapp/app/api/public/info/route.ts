import { NextRequest, NextResponse } from 'next/server';

const COBALT_API = 'https://api.cobalt.tools/api/json';
const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://invidious.nerdvpn.de',
  'https://invidious.jing.rocks'
];

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

    // Try Cobalt API first
    try {
      const cobaltResponse = await fetch(COBALT_API, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          vCodec: 'h264',
          vQuality: 'max',
          aFormat: 'mp3',
          filenamePattern: 'pretty',
          isAudioOnly: false,
          disableMetadata: false
        })
      });

      if (cobaltResponse.ok) {
        const cobaltData = await cobaltResponse.json();
        
        // Get additional info from Invidious
        const videoInfo = await getVideoInfoFromInvidious(videoId);
        
        return NextResponse.json({
          success: true,
          videoDetails: {
            title: videoInfo?.title || 'Unknown Title',
            author: videoInfo?.author || 'Unknown Author',
            duration: videoInfo?.lengthSeconds || 0,
            thumbnail: videoInfo?.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            description: videoInfo?.description?.substring(0, 200) || 'No description',
            viewCount: videoInfo?.viewCount || 0
          },
          formats: {
            video: [
              {
                quality: '1080p HD',
                resolution: '1920x1080',
                filesize: 'Varies',
                ext: 'mp4',
                downloadUrl: cobaltData.url || url
              },
              {
                quality: '720p HD',
                resolution: '1280x720',
                filesize: 'Varies',
                ext: 'mp4',
                downloadUrl: cobaltData.url || url
              },
              {
                quality: '480p',
                resolution: '854x480',
                filesize: 'Varies',
                ext: 'mp4',
                downloadUrl: cobaltData.url || url
              }
            ],
            audio: [
              {
                quality: '128 kbps',
                filesize: 'Varies',
                ext: 'mp3',
                downloadUrl: cobaltData.audio || url
              }
            ]
          },
          downloadUrl: cobaltData.url
        });
      }
    } catch (cobaltError) {
      console.log('Cobalt API failed, trying alternatives...');
    }

    // Fallback: Use Invidious API
    const videoInfo = await getVideoInfoFromInvidious(videoId);
    
    if (videoInfo) {
      const formats = videoInfo.adaptiveFormats || [];
      const videoFormats = formats
        .filter((f: any) => f.type?.includes('video/mp4'))
        .map((f: any) => ({
          quality: f.qualityLabel || f.quality,
          resolution: f.resolution || `${f.width}x${f.height}`,
          filesize: f.contentLength ? `${(parseInt(f.contentLength) / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
          ext: 'mp4',
          downloadUrl: f.url
        }))
        .slice(0, 5);

      const audioFormats = formats
        .filter((f: any) => f.type?.includes('audio'))
        .map((f: any) => ({
          quality: `${f.bitrate || 'Unknown'} kbps`,
          filesize: f.contentLength ? `${(parseInt(f.contentLength) / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
          ext: f.container || 'mp3',
          downloadUrl: f.url
        }))
        .slice(0, 3);

      return NextResponse.json({
        success: true,
        videoDetails: {
          title: videoInfo.title,
          author: videoInfo.author,
          duration: videoInfo.lengthSeconds,
          thumbnail: videoInfo.videoThumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
          description: videoInfo.description?.substring(0, 200) || 'No description',
          viewCount: videoInfo.viewCount
        },
        formats: {
          video: videoFormats.length > 0 ? videoFormats : getDefaultFormats(videoId),
          audio: audioFormats
        }
      });
    }

    // Final fallback with default formats
    return NextResponse.json({
      success: true,
      videoDetails: {
        title: 'YouTube Video',
        author: 'Unknown',
        duration: 0,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        description: 'Video information unavailable',
        viewCount: 0
      },
      formats: {
        video: getDefaultFormats(videoId),
        audio: []
      }
    });

  } catch (error) {
    console.error('Error in public API:', error);
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

async function getVideoInfoFromInvidious(videoId: string) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const response = await fetch(`${instance}/api/v1/videos/${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.log(`Failed to fetch from ${instance}`);
    }
  }
  
  return null;
}

function getDefaultFormats(videoId: string) {
  return [
    {
      quality: '720p HD (Recommended)',
      resolution: '1280x720',
      filesize: 'Click to download',
      ext: 'mp4',
      downloadUrl: `https://www.y2mate.com/youtube/${videoId}`
    },
    {
      quality: '480p',
      resolution: '854x480',
      filesize: 'Click to download',
      ext: 'mp4',
      downloadUrl: `https://www.y2mate.com/youtube/${videoId}`
    },
    {
      quality: '360p',
      resolution: '640x360',
      filesize: 'Click to download',
      ext: 'mp4',
      downloadUrl: `https://www.y2mate.com/youtube/${videoId}`
    }
  ];
}