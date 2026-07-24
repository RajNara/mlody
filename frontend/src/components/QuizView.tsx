import { useEffect, useState } from 'react';
import { getQuizTracks, selectTrack, startTraining, pollTrainProgress, type Track } from '../api';
import { IconThumbsUp, IconThumbsDown } from '../assets/Icons';
import TrackPlayer from './TrackPlayer';
import VinylSpinner from './VinylSpinner';
import './QuizView.css';

interface Props {
  sessionId: string;
  onLike: (t: Track) => void;
  onDislike: (t: Track) => void;
  onDone: (metrics: Record<string, unknown>) => void;
}

const BRIDGE_MESSAGES = [
  "You've set a solid baseline.",
  "Now, let's fine-tune your MLody.",
  "React to these specific tracks to calibrate your taste."
];

function QuizView({ sessionId, onLike, onDislike, onDone }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [fetching, setFetching] = useState(true);
  const [messageIndex, setMessageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [trainProgress, setTrainProgress] = useState({ done: 0, total: 0 });

  useEffect(() => {
    getQuizTracks().then(setTracks).finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (messageIndex >= BRIDGE_MESSAGES.length) return;
    const timer = setTimeout(() => setMessageIndex((i) => i + 1), 3600);
    return () => clearTimeout(timer);
  }, [messageIndex]);

  const handleAnswer = async (liked: boolean) => {
    const current = tracks[index];
    await selectTrack(sessionId, current, liked);
    if (liked) onLike(current); else onDislike(current);

    if (index < tracks.length - 1) {
      setIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    setTrainProgress({ done: 0, total: 0 });
    try {
      await startTraining(sessionId);
      const metrics = await pollTrainProgress(sessionId, setTrainProgress);
      onDone(metrics);
    } catch {
      onDone({});
    }
  };

  const showIntro = messageIndex < BRIDGE_MESSAGES.length || fetching;

  if (showIntro) {
    const currentMessage = messageIndex < BRIDGE_MESSAGES.length 
      ? BRIDGE_MESSAGES[messageIndex] 
      : "Loading your tracks...";

    return (
      <div className="quiz-status-view">
        <VinylSpinner />
        <h1 key={messageIndex} className="quiz-fade-text">
          {currentMessage}
        </h1>
      </div>
    );
  }

  if (submitting) {
    const hasTotal = trainProgress.total > 0;
    const percent = hasTotal ? (trainProgress.done / trainProgress.total) * 100 : 0;
    return (
      <div className="quiz-status-view">
        <VinylSpinner />
        <p className="quiz-status-text">Calibrating your MLody </p>
        <div className={`quiz-status-progress ${hasTotal ? 'determinate' : 'indeterminate'}`}>
          <div
            className="quiz-status-progress-fill"
            style={hasTotal ? { width: `${percent}%` } : undefined}
          />
        </div>
        {hasTotal && (
          <p className="quiz-status-progress-label">
            {trainProgress.done} / {trainProgress.total} tracks processed
          </p>
        )}
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="quiz-status-view">
        <p>No quiz tracks available.</p>
      </div>
    );
  }

  const current = tracks[index];
  const progress = ((index + 1) / tracks.length) * 100;

  return (
    <div className="quiz-view">
      <div className="quiz-header">
        <h2>Calibration: Song {index + 1} of {tracks.length}</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="quiz-card glass-card">
        <h3>Do you like this song?</h3>
        <h1>{current.name}</h1>
        <p>{current.artist}</p>
        {current.artwork_url && <img src={current.artwork_url} alt={current.name} />}
        {current.preview_url
          ? <TrackPlayer src={current.preview_url} autoPlay={index > 0} />
          : <p className="empty-hint">No audio preview available.</p>}
      </div>

      <div className="quiz-actions">
        <button
          className="quiz-action-btn quiz-action-like"
          onClick={() => handleAnswer(true)}
          aria-label="Like"
        >
          <IconThumbsUp size={28} />
        </button>
        <button
          className="quiz-action-btn quiz-action-dislike"
          onClick={() => handleAnswer(false)}
          aria-label="Dislike"
        >
          <IconThumbsDown size={28} />
        </button>
      </div>
    </div>
  );
}

export default QuizView;