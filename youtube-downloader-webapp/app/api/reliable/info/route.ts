import { NextRequest, NextResponse } from 'next/server';

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

    // Get basic video info using YouTube oEmbed API (always works)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedResponse = await fetch(oembedUrl);
    const oembedData = await oembedResponse.json();

    // Prepare response with reliable download options
    return NextResponse.json({
      success: true,
      videoDetails: {
        title: oembedData.title || 'YouTube Video',
        author: oembedData.author_name || 'Unknown',
        duration: 'N/A',
        thumbnail: oembedData.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
        description: 'Download this video using one of the options below',
        viewCount: 0,
        videoId: videoId
      },
      formats: {
        video: [
          {
            quality: '1080p HD',
            resolution: '1920x1080',
            filesize: 'Best Quality',
            ext: 'mp4',
            downloadMethod: 'external',
            downloadUrl: `https://www.y2mate.com/youtube/${videoId}`
          },
          {
            quality: '720p HD',
            resolution: '1280x720', 
            filesize: 'Good Quality',
            ext: 'mp4',
            downloadMethod: 'external',
            downloadUrl: `https://en.savefrom.net/1-youtube-video-downloader-${videoId}.html`
          },
          {
            quality: '480p',
            resolution: '854x480',
            filesize: 'Standard Quality',
            ext: 'mp4',
            downloadMethod: 'external',
            downloadUrl: `https://www.ssyoutube.com/watch?v=${videoId}`
          },
          {
            quality: 'Best Available',
            resolution: 'Various',
            filesize: 'Auto Select',
            ext: 'mp4',
            downloadMethod: 'external',
            downloadUrl: `https://9xbuddy.in/process?url=https://www.youtube.com/watch?v=${videoId}`
          }
        ],
        audio: [
          {
            quality: '320 kbps',
            filesize: 'High Quality',
            ext: 'mp3',
            downloadMethod: 'external',
            downloadUrl: `https://www.y2mate.com/youtube-mp3/${videoId}`
          },
          {
            quality: '128 kbps',
            filesize: 'Standard Quality',
            ext: 'mp3',
            downloadMethod: 'external',
            downloadUrl: `https://www.yt2mate.com/youtube-mp3-downloader/${videoId}`
          }
        ]
      },
      instructions: {
        title: 'How to Download:',
        steps: [
          '1. Click on your preferred quality/format above',
          '2. You will be redirected to a download service',
          '3. Click the download button on that page',
          '4. Your download will start automatically'
        ],
        note: 'Due to YouTube\'s restrictions, we use trusted third-party services for downloads.'
      }
    });

  } catch (error) {
    console.error('Error in reliable API:', error);
    return NextResponse.json({ 
      error: 'Failed to process video. Please check the URL and try again.',
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