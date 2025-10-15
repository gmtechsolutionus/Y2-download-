import ytdl from 'ytdl-core';

export async function getVideoInfo(url: string) {
  try {
    if (!ytdl.validateURL(url)) {
      throw new Error('Invalid YouTube URL');
    }
    
    const info = await ytdl.getInfo(url);
    return info;
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific ytdl-core errors
      if (error.message.includes('Video unavailable')) {
        throw new Error('This video is unavailable or private');
      }
      if (error.message.includes('age-restricted')) {
        throw new Error('This video is age-restricted');
      }
      if (error.message.includes('copyright')) {
        throw new Error('This video has copyright restrictions');
      }
    }
    throw error;
  }
}

export function createDownloadStream(url: string, options: ytdl.downloadOptions) {
  return ytdl(url, {
    ...options,
    requestOptions: {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    }
  });
}