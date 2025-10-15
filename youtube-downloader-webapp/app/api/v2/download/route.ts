import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const videoUrl = searchParams.get('url');
  const title = searchParams.get('title') || 'video';
  const ext = searchParams.get('ext') || 'mp4';
  
  if (!videoUrl) {
    return NextResponse.json({ error: 'Video URL is required' }, { status: 400 });
  }

  try {
    // Fetch the video from the direct URL
    const response = await fetch(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Range': 'bytes=0-' // Support partial content
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }

    // Get content type and length
    const contentType = response.headers.get('content-type') || 'video/mp4';
    const contentLength = response.headers.get('content-length');
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(title)}.${ext}"`);
    
    if (contentLength) {
      headers.set('Content-Length', contentLength);
    }
    
    // Support range requests for resume capability
    const acceptRanges = response.headers.get('accept-ranges');
    if (acceptRanges) {
      headers.set('Accept-Ranges', acceptRanges);
    }

    // Stream the response
    return new NextResponse(response.body, {
      headers,
      status: response.status
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Failed to download video',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^\w\s-]/gi, '')
    .trim()
    .substring(0, 100);
}