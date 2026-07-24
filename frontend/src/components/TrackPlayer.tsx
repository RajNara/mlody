import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react';
import { IconPlay, IconPause } from '../assets/Icons';
import './TrackPlayer.css';

interface Props {
  src: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

function TrackPlayer({ src }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0–1
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => {
      setProgress(0);
      setCurrentTime(0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      // pause any other preview currently playing so only one plays at once
      document.querySelectorAll<HTMLAudioElement>('audio[data-track-player]').forEach((el) => {
        if (el !== audio) el.pause();
      });
      audio.play();
    } else {
      audio.pause();
    }
  };

  const handleSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    const ratio = Number(e.target.value);
    setProgress(ratio);
    if (audio && duration) {
      audio.currentTime = ratio * duration;
    }
  };

  return (
    <div className="track-player">
      <audio ref={audioRef} src={src} preload="metadata" data-track-player />

      <button
        type="button"
        className="track-player-toggle"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
      >
        {isPlaying ? <IconPause size={13} /> : <IconPlay size={13} />}
      </button>

      <input
        type="range"
        className="track-player-scrubber"
        min={0}
        max={1}
        step={0.001}
        value={Number.isFinite(progress) ? progress : 0}
        onChange={handleSeek}
        style={{ '--progress': `${(Number.isFinite(progress) ? progress : 0) * 100}%` } as CSSProperties}
        aria-label="Seek preview"
      />

      <span className="track-player-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>
    </div>
  );
}

export default TrackPlayer;