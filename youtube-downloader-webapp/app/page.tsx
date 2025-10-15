'use client';

import { useState } from 'react';
import axios from 'axios';

interface VideoInfo {
  title: string;
  author: string;
  thumbnail: string;
  videoId: string;
  downloadLinks: Array<{
    quality: string;
    format: string;
    url: string;
  }>;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);

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
      const response = await axios.post('/api/download', { url });
      setVideoInfo(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process video');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (videoId: string) => {
    // Open YouTube video in new tab for manual download
    // Note: Direct downloading requires server-side processing which has limitations on Vercel
    window.open(`https://www.ssyoutube.com/watch?v=${videoId}`, '_blank');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-red-500 to-pink-500 bg-clip-text text-transparent">
            YouTube Video Downloader
          </h1>
          <p className="text-center text-gray-400 mb-12">
            Download YouTube videos easily by pasting the URL below
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
                  
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold mb-2">Download Options:</h3>
                    <button
                      onClick={() => handleDownload(videoInfo.videoId)}
                      className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
                    >
                      Download Video (MP4)
                    </button>
                    <p className="text-sm text-gray-400 text-center">
                      Click to open download page in new tab
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-16 text-center text-gray-500 text-sm">
            <p className="mb-2">⚠️ Important: Respect copyright laws and YouTube's Terms of Service</p>
            <p>Only download videos you have permission to download</p>
          </div>
        </div>
      </div>
    </main>
  );
}