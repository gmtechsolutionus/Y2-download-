import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import { Readable } from 'stream';

export async function POST(request: NextRequest) {
  try {
    const { url, quality = 'highest' } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    // Get video info
    const info = await ytdl.getInfo(url);
    const videoDetails = {
      title: info.videoDetails.title,
      author: info.videoDetails.author.name,
      lengthSeconds: info.videoDetails.lengthSeconds,
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      formats: info.formats
        .filter(format => format.hasVideo && format.hasAudio)
        .map(format => ({
          quality: format.qualityLabel,
          container: format.container,
          size: format.contentLength ? `${(parseInt(format.contentLength) / 1024 / 1024).toFixed(2)} MB` : 'Unknown',
          itag: format.itag
        }))
    };

    return NextResponse.json({
      success: true,
      videoInfo: videoDetails,
      downloadEndpoint: '/api/stream-video'
    });
  } catch (error) {
    console.error('Error fetching video info:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video information',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const itag = searchParams.get('itag');
  
  if (!url || !ytdl.validateURL(url)) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  try {
    const info = await ytdl.getInfo(url);
    const format = info.formats.find(f => f.itag === parseInt(itag || '18'));
    
    if (!format) {
      return NextResponse.json({ error: 'Format not found' }, { status: 404 });
    }

    // Create download stream
    const stream = ytdl(url, { format });
    
    // Convert Node.js stream to Web stream
    const webStream = Readable.toWeb(stream as any);
    
    // Set appropriate headers
    const headers = new Headers();
    headers.set('Content-Type', format.mimeType || 'video/mp4');
    headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(info.videoDetails.title)}.${format.container}"`);
    
    if (format.contentLength) {
      headers.set('Content-Length', format.contentLength);
    }

    return new NextResponse(webStream as any, {
      headers,
      status: 200
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({ 
      error: 'Download failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^\w\s-]/gi, '').trim();
}