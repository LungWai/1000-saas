import { useEffect, useState } from 'react';

interface VideoFile {
  path: string;
}

/**
 * Component that renders a video background covering the entire page
 * Videos should follow the pattern: Bg-video-XX.mp4
 * Supported format: MP4 with H.264 video codec and AAC audio codec
 */
export default function VideoBackground() {
  const [videoFile, setVideoFile] = useState<VideoFile | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  // Function to check video compatibility
  const checkVideoCompatibility = (video: HTMLVideoElement): boolean => {
    return video.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') !== "";
  };
  
  useEffect(() => {
    // Reset states when component mounts/refreshes
    setIsLoaded(false);
    setErrorDetails(null);
    
    // List of available video files
    const videoFiles: VideoFile[] = [
      { path: 'Bg-video-01.mp4' },
      { path: 'Bg-video-02.mp4' },
      { path: 'Bg-video-03.mp4' },
      { path: 'Bg-video-04.mp4' },
      { path: 'Bg-video-05.mp4' },
      { path: 'Bg-video-06.mp4' },
      { path: 'Bg-video-07.mp4' },
      { path: 'Bg-video-08.mp4' },
      { path: 'Bg-video-09.mp4' },
      { path: 'Bg-video-10.mp4' },
      { path: 'Bg-video-11.mp4' },
      { path: 'Bg-video-12.mp4' },
      { path: 'Bg-video-13.mp4' },
      { path: 'Bg-video-14.mp4' },
      { path: 'Bg-video-15.mp4' },
      { path: 'Bg-video-16.mp4' },
      { path: 'Bg-video-17.mp4' },
      { path: 'Bg-video-18.mp4' },
      { path: 'Bg-video-19.mp4' },
      { path: 'Bg-video-20.mp4' },      
    ];
    
    // Select a random video file
    const randomIndex = Math.floor(Math.random() * videoFiles.length);
    const selectedFile = videoFiles[randomIndex];
    setVideoFile(selectedFile);
    
    // Log for debugging
    console.log('Selected video file:', selectedFile);
  }, []);
  
  if (!videoFile) return null;
  
  const handleError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = event.currentTarget;
    const mediaError = videoElement.error;
    
    let errorMessage = 'Unknown error';
    if (mediaError) {
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          errorMessage = 'You aborted the video playback';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          errorMessage = 'A network error occurred';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          errorMessage = 'The video format is not supported';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          errorMessage = 'Video source not supported';
          break;
      }
    }
    
    setErrorDetails(errorMessage);
    console.error('Video error:', {
      path: videoFile.path,
      error: errorMessage,
      code: mediaError?.code,
      message: mediaError?.message,
      networkState: videoElement.networkState,
      readyState: videoElement.readyState,
      currentSrc: videoElement.currentSrc
    });
  };
  
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
        key={videoFile.path}
        autoPlay 
        loop 
        muted 
        playsInline
        preload="auto"
        className="absolute top-0 left-0 min-w-full min-h-full w-auto h-auto object-cover"
        style={{
          width: '100%',
          height: '100%'
        }}
        onLoadStart={(e) => {
          const video = e.target as HTMLVideoElement;
          if (!checkVideoCompatibility(video)) {
            setErrorDetails('Browser does not support the video codec');
            console.warn('Video codec not supported');
          }
        }}
        onLoadedData={(e) => {
          setIsLoaded(true);
          console.log('Video loaded successfully', {
            duration: e.currentTarget.duration,
            videoWidth: e.currentTarget.videoWidth,
            videoHeight: e.currentTarget.videoHeight,
            readyState: e.currentTarget.readyState,
            networkState: e.currentTarget.networkState
          });
        }}
        onError={handleError}
      >
        <source 
          src={`/${videoFile.path}`} 
          type="video/mp4"
        />
        Your browser does not support the video tag.
      </video>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center text-foreground bg-background/30 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-4 border-primary rounded-full border-t-transparent"></div>
            <p>Loading video{errorDetails ? `: ${errorDetails}` : '...'}</p>
          </div>
        </div>
      )}
    </div>
  );
} 