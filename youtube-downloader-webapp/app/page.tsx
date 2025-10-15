'use client';

import { useState } from 'react';
import axios from 'axios';

interface VideoInfo {
  title: string;
  author: string;
  thumbnail: string;
  videoId: string;
  downloadUrl?: string;
  alternativeDownloads?: Array<{
    service: string;
    url: string;
  }>;
  downloadOptions?: Array<{
    method: string;
    quality: string;
    url: string;
    instructions: string;
  }>;
  formats?: Array<{
    quality: string;
    url: string;
    size?: string;
  }>;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState('720p');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVideoInfo(null);
    
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    
    try {
      // Try multiple APIs in order of preference
      let response;
      
      try {
        // First try the direct download API
        response = await axios.post('/api/direct-download', { url, quality: selectedQuality });
        if (response.data.success) {
          const data = response.data;
          setVideoInfo({
            title: data.videoInfo.title,
            author: data.videoInfo.author,
            thumbnail: data.videoInfo.thumbnail,
            videoId: extractVideoId(url) || '',
            downloadOptions: data.downloadLinks.map((link: any) => ({
              method: 'external',
              quality: link.quality || 'Multiple',
              url: link.url,
              instructions: `Download via ${link.service}`
            }))
          });
          return;
        }
      } catch (err) {
        console.log('Direct download API failed, trying alternatives...');
      }
      
      // Try the YouTube API
      try {
        response = await axios.post('/api/youtube', { url });
        setVideoInfo(response.data);
      } catch (err) {
        // Final fallback
        response = await axios.post('/api/download', { url });
        setVideoInfo(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process video. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return null;
  };

  const handleDirectDownload = async (downloadUrl?: string) => {
    if (!videoInfo) return;
    
    setDownloading(true);
    
    try {
      if (downloadUrl) {
        // Direct download URL available
        window.open(downloadUrl, '_blank');
      } else {
        // Use proxy download
        window.open(`/api/proxy-download?v=${videoInfo.videoId}&quality=${selectedQuality}`, '_blank');
      }
    } catch (err) {
      setError('Download failed. Please try an alternative method.');
    } finally {
      setDownloading(false);
    }
  };

  const handleAlternativeDownload = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            YouTube Video Downloader
          </h1>
          <p className="text-center text-gray-400 mb-12">
            Download YouTube videos directly in MP4 format
          </p>

          <form onSubmit={handleSubmit} className="mb-12">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="flex-1 px-6 py-4 rounded-lg bg-gray-800 border border-gray-700 focus:border-red-500 focus:outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Get Video'
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-8 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {videoInfo && (
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-gray-700">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <img
                    src={videoInfo.thumbnail}
                    alt={videoInfo.title}
                    className="w-full rounded-lg shadow-lg"
                  />
                </div>
                <div className="flex flex-col justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{videoInfo.title}</h2>
                    <p className="text-gray-400 mb-6">by {videoInfo.author}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold mb-3">Download Options:</h3>
                    
                    {/* Quality selector */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Select Quality:</label>
                      <select
                        value={selectedQuality}
                        onChange={(e) => setSelectedQuality(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-red-500"
                      >
                        <option value="1080p">1080p HD</option>
                        <option value="720p">720p HD</option>
                        <option value="480p">480p</option>
                        <option value="360p">360p</option>
                      </select>
                    </div>

                    {/* Direct download button */}
                    <button
                      onClick={() => handleDirectDownload(videoInfo.downloadUrl)}
                      disabled={downloading}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {downloading ? 'Processing...' : 'Download MP4 (Direct)'}
                    </button>

                    {/* Alternative download options */}
                    {videoInfo.downloadOptions && videoInfo.downloadOptions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Alternative methods:</p>
                        {videoInfo.downloadOptions.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => handleAlternativeDownload(option.url)}
                            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
                          >
                            {option.instructions} ({option.quality})
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Fallback download options */}
                    {videoInfo.alternativeDownloads && (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm text-gray-400">External downloaders:</p>
                        {videoInfo.alternativeDownloads.map((alt, index) => (
                          <button
                            key={index}
                            onClick={() => handleAlternativeDownload(alt.url)}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors"
                          >
                            Download via {alt.service}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Available formats */}
                    {videoInfo.formats && videoInfo.formats.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm text-gray-400">Available formats:</p>
                        {videoInfo.formats.map((format, index) => (
                          <button
                            key={index}
                            onClick={() => handleDirectDownload(format.url)}
                            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm transition-colors"
                          >
                            {format.quality} {format.size && `(${format.size})`}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 text-center text-gray-500 text-sm">
            <p className="mb-2">⚠️ Important: Respect copyright laws and YouTube\'s Terms of Service</p>
            <p>Only download videos you have permission to download</p>
            <p className="mt-4 text-xs">This tool provides multiple download methods to ensure reliability</p>
          </div>
        </div>
      </div>
    </main>
  );
}