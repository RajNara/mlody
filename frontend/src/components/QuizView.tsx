import { useEffect, useState } from 'react';
import { getQuizTracks, selectTrack, trainModel, type Track } from '../api';

interface Props {
  sessionId: string;
  onLike: (t: Track) => void;
  onDislike: (t: Track) => void;
  onDone: (metrics: Record<string, unknown>) => void;
}

function QuizView({ sessionId, onLike, onDislike, onDone }: Props) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getQuizTracks().then(setTracks).finally(() => setLoading(false));
  }, []);

  const handleAnswer = async (liked: boolean) => {
    const current = tracks[index];
    await selectTrack(sessionId, current, liked);
    if (liked) onLike(current); else onDislike(current);

    if (index < tracks.length - 1) {
      setIndex((i) => i + 1);
      return;
    }

    setSubmitting(true);
    const result = await trainModel(sessionId);
    onDone(result.metrics);
  };

  if (loading) return <p>Loading quiz…</p>;
  if (submitting) return <p>Calibrating your MLody…</p>;
  if (tracks.length === 0) return <p>No quiz tracks available.</p>;

  const current = tracks[index];
  const progress = ((index + 1) / tracks.length) * 100;

  return (
    <div className="quiz-view">
      <h2>Calibration: Song {index + 1} of {tracks.length}</h2>
      <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

      <div className="quiz-card">
        <h3>Do you like this song?</h3>
        <h1>{current.name}</h1>
        <p>{current.artist}</p>
        {current.artwork_url && <img src={current.artwork_url} width={120} alt={current.name} />}
        {current.preview_url
          ? <audio controls autoPlay={index > 0} src={current.preview_url} />
          : <p className="empty-hint">No audio preview available.</p>}
      </div>

      <div className="quiz-actions">
        <button className="yes-btn" onClick={() => handleAnswer(true)}>💚 Yes</button>
        <button className="no-btn" onClick={() => handleAnswer(false)}>👎 No</button>
      </div>
    </div>
  );
}

export default QuizView;