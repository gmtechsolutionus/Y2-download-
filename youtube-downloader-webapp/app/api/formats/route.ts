import { NextRequest, NextResponse } from 'next/server';
import ytdl from 'ytdl-core';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || !ytdl.validateURL(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 });
    }

    const info = await ytdl.getInfo(url);
    
    // Group formats by quality
    const videoFormats = info.formats
      .filter(format => format.hasVideo && format.hasAudio && format.container === 'mp4')
      .sort((a, b) => {
        const qualityOrder = ['1080p', '720p', '480p', '360p', '240p', '144p'];
        const aIndex = qualityOrder.indexOf(a.qualityLabel || '');
        const bIndex = qualityOrder.indexOf(b.qualityLabel || '');
        return aIndex - bIndex;
      })
      .map(format => ({
        quality: format.qualityLabel || 'Unknown',
        resolution: format.width ? `${format.width}x${format.height}` : 'Unknown',
        fps: format.fps || 30,
        size: format.contentLength 
          ? `${(parseInt(format.contentLength) / 1024 / 1024).toFixed(2)} MB`
          : 'Unknown size',
        itag: format.itag,
        container: format.container,
        codec: format.videoCodec
      }));

    const audioFormats = info.formats
      .filter(format => format.hasAudio && !format.hasVideo)
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0))
      .slice(0, 3)
      .map(format => ({
        quality: `${format.audioBitrate || 'Unknown'} kbps`,
        codec: format.audioCodec,
        size: format.contentLength 
          ? `${(parseInt(format.contentLength) / 1024 / 1024).toFixed(2)} MB`
          : 'Unknown size',
        itag: format.itag,
        container: format.container
      }));

    return NextResponse.json({
      success: true,
      videoDetails: {
        title: info.videoDetails.title,
        author: info.videoDetails.author.name,
        duration: formatDuration(parseInt(info.videoDetails.lengthSeconds)),
        thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
        description: info.videoDetails.description?.substring(0, 200) + '...'
      },
      formats: {
        video: videoFormats,
        audio: audioFormats
      }
    });
  } catch (error) {
    console.error('Error fetching formats:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch video formats',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}