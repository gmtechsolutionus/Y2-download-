import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';
import { Readable } from 'stream';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const quality = searchParams.get('quality') || 'highest';
  const format = searchParams.get('format') || 'mp4';
  
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  if (!ytdl.validateURL(url)) {
    return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
  }

  try {
    // Get video info first
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title;
    
    // Set up quality options
    let qualityOption: ytdl.downloadOptions['quality'] = 'highest';
    
    if (quality === '1080p') {
      qualityOption = 'highestvideo';
    } else if (quality === '720p') {
      qualityOption = '22'; // iTunes 720p
    } else if (quality === '480p') {
      qualityOption = '135'; // 480p
    } else if (quality === '360p') {
      qualityOption = '18'; // 360p
    }
    
    // Create the download stream
    const videoStream = ytdl(url, {
      quality: qualityOption,
      filter: format === 'mp3' ? 'audioonly' : 'audioandvideo',
    });

    // Handle stream errors
    videoStream.on('error', (error) => {
      console.error('Stream error:', error);
    });

    // Convert to web stream
    const webStream = Readable.toWeb(videoStream as any);
    
    // Set headers for download
    const headers = new Headers();
    const extension = format === 'mp3' ? 'mp3' : 'mp4';
    const mimeType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';
    
    headers.set('Content-Type', mimeType);
    headers.set('Content-Disposition', `attachment; filename="${sanitizeFilename(videoTitle)}.${extension}"`);
    headers.set('Cache-Control', 'no-cache');
    
    return new NextResponse(webStream as any, {
      headers,
      status: 200
    });
  } catch (error) {
    console.error('Streaming error:', error);
    return NextResponse.json({ 
      error: 'Failed to stream video',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function sanitizeFilename(filename: string): string {
  // Remove special characters and limit length
  return filename
    .replace(/[^\w\s-]/gi, '')
    .trim()
    .substring(0, 100);
}