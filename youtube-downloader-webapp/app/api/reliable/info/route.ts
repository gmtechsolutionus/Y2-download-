import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    console.log('Processing URL:', url);

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      console.error('Failed to extract video ID from URL:', url);
      return NextResponse.json({ 
        error: 'Invalid YouTube URL. Please make sure you\'re using a valid YouTube video link.',
        supportedFormats: [
          'https://www.youtube.com/watch?v=VIDEO_ID',
          'https://youtu.be/VIDEO_ID',
          'https://youtube.com/shorts/VIDEO_ID',
          'https://m.youtube.com/watch?v=VIDEO_ID'
        ]
      }, { status: 400 });
    }
    
    console.log('Extracted video ID:', videoId);

    // Get basic video info using YouTube oEmbed API (always works)
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedResponse = await fetch(oembedUrl);
    
    if (!oembedResponse.ok) {
      console.error('oEmbed API failed:', oembedResponse.status, oembedResponse.statusText);
      // Continue with basic info even if oEmbed fails
    }
    
    let oembedData: any = {};
    try {
      oembedData = await oembedResponse.json();
    } catch (e) {
      console.error('Failed to parse oEmbed response:', e);
      // Continue with default values
    }

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
  // Clean the URL
  url = url.trim();
  
  const patterns = [
    // Standard watch URLs
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    // Embed URLs
    /youtube\.com\/embed\/([^&\n?#]+)/,
    // Short URLs with /v/
    /youtube\.com\/v\/([^&\n?#]+)/,
    // YouTube Shorts
    /youtube\.com\/shorts\/([^&\n?#]+)/,
    // Mobile URLs
    /m\.youtube\.com\/watch\?v=([^&\n?#]+)/,
    // YouTube Music
    /music\.youtube\.com\/watch\?v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Clean the video ID (remove any query parameters that might be attached)
      return match[1].split('?')[0];
    }
  }
  
  // Try to extract ID from URL parameters if it's a different format
  try {
    const urlObj = new URL(url);
    const videoId = urlObj.searchParams.get('v');
    if (videoId) {
      return videoId;
    }
  } catch (e) {
    // URL parsing failed, continue with other methods
  }
  
  return null;
}