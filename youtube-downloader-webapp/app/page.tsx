'use client';

import { useState } from 'react';
import axios from 'axios';

interface VideoFormat {
  quality: string;
  resolution?: string;
  fps?: number;
  size: string;
  itag: number;
  container: string;
  codec?: string;
}

interface VideoDetails {
  title: string;
  author: string;
  duration: string;
  thumbnail: string;
  description: string;
}

interface FormatResponse {
  success: boolean;
  videoDetails: VideoDetails;
  formats: {
    video: VideoFormat[];
    audio: VideoFormat[];
  };
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');
  const [videoData, setVideoData] = useState<FormatResponse | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<VideoFormat | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setVideoData(null);
    setSelectedFormat(null);
    
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('/api/formats', { url });
      setVideoData(response.data);
      // Auto-select the highest quality format
      if (response.data.formats.video.length > 0) {
        setSelectedFormat(response.data.formats.video[0]);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch video information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedFormat || !videoData) return;
    
    setDownloading(true);
    setDownloadProgress(0);
    
    try {
      // Create download URL
      const downloadUrl = `/api/stream-video?url=${encodeURIComponent(url)}&quality=${selectedFormat.quality}&format=mp4`;
      
      // Create invisible anchor and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${videoData.videoDetails.title}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Simulate progress (since we can't track real progress with this method)
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 500);
      
      setTimeout(() => {
        setDownloadProgress(100);
        clearInterval(interval);
      }, 5000);
    } catch (err) {
      setError('Download failed. Please try again.');
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 1000);
    }
  };

  const handleAudioDownload = async () => {
    if (!videoData) return;
    
    setDownloading(true);
    
    try {
      const downloadUrl = `/api/stream-video?url=${encodeURIComponent(url)}&format=mp3`;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${videoData.videoDetails.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Audio download failed.');
    } finally {
      setTimeout(() => setDownloading(false), 1000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-6xl font-bold text-center mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            YouTube Direct Downloader
          </h1>
          <p className="text-center text-gray-300 mb-12 text-lg">
            Download YouTube videos directly - No third-party sites required
          </p>

          <form onSubmit={handleSubmit} className="mb-12">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="flex-1 px-6 py-4 rounded-xl bg-gray-800/50 backdrop-blur-sm border border-gray-700 focus:border-purple-500 focus:outline-none transition-all"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-10 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Fetching...
                  </span>
                ) : (
                  'Get Video'
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-8 p-4 bg-red-500/20 backdrop-blur-sm border border-red-500 rounded-xl text-red-300">
              {error}
            </div>
          )}

          {videoData && videoData.success && (
            <div className="bg-gray-800/30 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-gray-700">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <img
                    src={videoData.videoDetails.thumbnail}
                    alt={videoData.videoDetails.title}
                    className="w-full rounded-xl shadow-lg"
                  />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">{videoData.videoDetails.title}</h2>
                  <p className="text-gray-300 mb-2">by {videoData.videoDetails.author}</p>
                  <p className="text-gray-400 mb-4">Duration: {videoData.videoDetails.duration}</p>
                  <p className="text-gray-400 text-sm mb-6">{videoData.videoDetails.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Video formats section */}
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-purple-300">Video Formats</h3>
                  <div className="grid gap-3">
                    {videoData.formats.video.map((format) => (
                      <div
                        key={format.itag}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedFormat?.itag === format.itag
                            ? 'bg-purple-600/30 border-purple-500'
                            : 'bg-gray-700/30 border-gray-600 hover:border-purple-400'
                        }`}
                        onClick={() => setSelectedFormat(format)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold">{format.quality}</span>
                            <span className="text-gray-400 ml-2">({format.resolution})</span>
                            <span className="text-gray-500 ml-2 text-sm">{format.fps}fps</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-300">{format.size}</span>
                            <span className="text-gray-500 ml-2 text-sm">{format.container}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Download buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleDownload}
                    disabled={!selectedFormat || downloading}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    {downloading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Downloading... {downloadProgress > 0 && `${downloadProgress}%`}
                      </span>
                    ) : (
                      'Download Video (MP4)'
                    )}
                  </button>
                  
                  <button
                    onClick={handleAudioDownload}
                    disabled={downloading}
                    className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    Download Audio (MP3)
                  </button>
                </div>

                {/* Progress bar */}
                {downloading && downloadProgress > 0 && (
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-500"
                      style={{ width: `${downloadProgress}%` }}
                    />
                  </div>
                )}

                {/* Audio formats section */}
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-3 text-blue-300">Audio Only Formats</h3>
                  <div className="grid gap-2">
                    {videoData.formats.audio.slice(0, 3).map((format, index) => (
                      <div
                        key={format.itag}
                        className="p-3 rounded-lg bg-gray-700/30 border border-gray-600 text-sm"
                      >
                        <div className="flex justify-between items-center">
                          <span>Audio {format.quality}</span>
                          <span className="text-gray-400">{format.size}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 text-center text-gray-400 text-sm">
            <p className="mb-2">✨ Direct download from YouTube servers</p>
            <p className="mb-2">🚀 No third-party sites or redirects</p>
            <p className="mb-4">🔒 Secure and private downloading</p>
            <div className="border-t border-gray-700 pt-4 mt-4">
              <p className="text-gray-500">⚠️ Please respect copyright laws and YouTube\'s Terms of Service</p>
              <p className="text-gray-500">Only download videos you have permission to download</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}