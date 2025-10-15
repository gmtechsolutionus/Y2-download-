import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoId = searchParams.get('v');
  const quality = searchParams.get('quality') || '720';
  
  if (!videoId) {
    return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
  }

  try {
    // Use a public YouTube download service API
    const apiUrl = `https://loader.to/api/button/?url=https://www.youtube.com/watch?v=${videoId}&f=${quality}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch download link');
    }

    const html = await response.text();
    
    // Parse the response to extract download link
    const downloadLinkMatch = html.match(/href="([^"]+)"\s+download/);
    
    if (downloadLinkMatch && downloadLinkMatch[1]) {
      // Redirect to the download link
      return NextResponse.redirect(downloadLinkMatch[1]);
    }

    // If direct download fails, redirect to an external service
    return NextResponse.redirect(`https://www.y2mate.com/youtube/${videoId}`);
    
  } catch (error) {
    console.error('Proxy download error:', error);
    // Fallback to external service
    return NextResponse.redirect(`https://www.savefrom.net/en/?url=https://www.youtube.com/watch?v=${videoId}`);
  }
}