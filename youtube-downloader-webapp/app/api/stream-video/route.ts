import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const quality = searchParams.get('quality') || 'highest';
  const format = searchParams.get('format') || 'mp4';
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  // Extract video ID
  const videoId = extractVideoId(url);
  if (!videoId) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  // Redirect to external download service
  const qualityMap: { [key: string]: string } = {
    '1080p': 'https://www.y2mate.com/youtube/',
    '720p': 'https://en.savefrom.net/1-youtube-video-downloader-',
    '480p': 'https://www.ssyoutube.com/watch?v=',
    '360p': 'https://9xbuddy.in/process?url=https://www.youtube.com/watch?v='
  };

  const baseUrl = qualityMap[quality] || qualityMap['720p'];
  const redirectUrl = baseUrl.includes('9xbuddy') ? baseUrl + videoId : baseUrl + videoId;

  return NextResponse.redirect(redirectUrl);
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