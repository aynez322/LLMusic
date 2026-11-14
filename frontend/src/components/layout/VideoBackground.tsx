import { useMediaQuery } from '../../lib/media'

export function VideoBackground() {
  const still = useMediaQuery('(prefers-reduced-motion: reduce)')

  return (
    <div aria-hidden className="video-bg fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {still ? (
        <img src="/bg/vinyl.jpg" alt="" className="w-full h-full object-cover" />
      ) : (
        <video
          className="w-full h-full object-cover"
          poster="/bg/vinyl.jpg"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
        >
          {/* 4K only where the screen can show it (large or high-density
              displays); phones and normal screens get 1080p. AV1 first,
              H.264 for browsers without it. All visually identical to the original. */}
          <source
            src="/bg/vinyl-2160-av1.mp4"
            type='video/mp4; codecs="av01.0.12M.08"'
            media="(min-width: 1921px), (min-width: 1200px) and (min-resolution: 1.5dppx)"
          />
          <source src="/bg/vinyl-1080-av1.mp4" type='video/mp4; codecs="av01.0.08M.08"' />
          <source src="/bg/vinyl-1080.mp4" type="video/mp4" />
        </video>
      )}
      <div className="absolute inset-0 video-veil" />
    </div>
  )
}
