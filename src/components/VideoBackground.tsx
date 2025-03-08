import { useEffect, useState } from 'react';

/**
 * Component that renders a video background covering the entire page
 * The video is randomly selected from available videos
 */
export default function VideoBackground() {
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  
  useEffect(() => {
    // List of available video files
    const videoFiles = [
      'Bg-video-01.mp4',
      'Bg-video-02.mp4',
      'Bg-video-03.mp4',
      'Bg-video-04.mp4',
      'Bg-video-05.mp4',
      'Bg-video-06.mp4',
      'Bg-video-07.mp4',
      'Bg-video-08.mp4',
      'Bg-video-09.mp4',
      'Bg-video-10.mp4',
    ];
    
    // Select a random video
    const randomIndex = Math.floor(Math.random() * videoFiles.length);
    const selectedVideo = videoFiles[randomIndex];
    setVideoFile(selectedVideo);
    
    // Log for debugging
    console.log('Selected video file:', selectedVideo);
  }, []);
  
  if (!videoFile) return null;
  
  return (
    <div 
      className="fixed inset-0 w-full h-full" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        overflow: 'hidden'
      }}
    >
      <video 
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute top-0 left-0 min-w-full min-h-full w-auto h-auto object-cover"
        style={{
          width: '100%',
          height: '100%'
        }}
        onLoadedData={() => {
          setVideoLoaded(true);
          console.log('Video loaded successfully');
        }}
        onError={(e) => console.error('Video error:', e)}
      >
        <source src={`/${videoFile}`} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {!videoLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-foreground">
          Loading video...
        </div>
      )}
    </div>
  );
} 