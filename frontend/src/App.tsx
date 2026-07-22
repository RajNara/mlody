import { useState, type SetStateAction } from 'react';
import LandingView from './components/LandingView';
import SearchView from './components/SearchView';
import QuizView from './components/QuizView';
import CompleteView from './components/CompleteView';
import { selectTrack, type Track } from './api';
import './App.css';

// mirrors the old Streamlit `profile_step` session state
type ProfileStep = 'landing' | 'search' | 'quiz' | 'complete';

function App() {
  // one id per browser session, sent on every call so /select and /train
  // agree on whose likes/dislikes they're touching — no login, by design
  const [sessionId] = useState<string>(() => crypto.randomUUID());
  const [step, setStep] = useState<ProfileStep>('landing');
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [dislikedSongs, setDislikedSongs] = useState<Track[]>([]);
  const [trainMetrics, setTrainMetrics] = useState<Record<string, unknown> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // mirrors add_song() from initialize_user_model.py: a track can't be in
  // both lists, and picking it for the other side needs an explicit remove first
  const handlePick = async (track: Track, liked: boolean) => {
    const inLikes = likedSongs.some((s) => s.track_id === track.track_id);
    const inDislikes = dislikedSongs.some((s) => s.track_id === track.track_id);

    if (liked && inDislikes) return setToast('Already in your dislikes — remove it there first.');
    if (!liked && inLikes) return setToast('Already in your likes — remove it there first.');
    if ((liked && inLikes) || (!liked && inDislikes)) return; // already picked, no-op

    await selectTrack(sessionId, track, liked);
    if (liked) setLikedSongs((prev) => [...prev, track]);
    else setDislikedSongs((prev) => [...prev, track]);
  };

  // NOTE: this only removes locally. The backend's SESSION_TRACKS still has
  // the earlier /select call recorded — fine for now since nothing re-reads
  // it until /train, but a real /deselect endpoint would close this gap.
  const handleRemove = (trackId: string, liked: boolean) => {
    if (liked) setLikedSongs((prev) => prev.filter((s) => s.track_id !== trackId));
    else setDislikedSongs((prev) => prev.filter((s) => s.track_id !== trackId));
  };

  return (
    <div className="app-shell">
      {toast && <div className="toast" onClick={() => setToast(null)}>{toast}</div>}

      {step === 'landing' && (
        <LandingView onStart={() => setStep('search')} />
      )}

      {step === 'search' && (
        <SearchView
          likedSongs={likedSongs}
          dislikedSongs={dislikedSongs}
          onLike={(t: Track) => handlePick(t, true)}
          onDislike={(t: Track) => handlePick(t, false)}
          onRemove={handleRemove}
          onContinue={() => setStep('quiz')}
        />
      )}
      {step === 'quiz' && (
        <QuizView
          sessionId={sessionId}
          onLike={(t: Track) => setLikedSongs((prev) => [...prev, t])}
          onDislike={(t: Track) => setDislikedSongs((prev) => [...prev, t])}
          onDone={(metrics: SetStateAction<Record<string, unknown> | null>) => { setTrainMetrics(metrics); setStep('complete'); }}
        />
      )}
      {step === 'complete' && (
        <CompleteView
          likeCount={likedSongs.length}
          dislikeCount={dislikedSongs.length}
          metrics={trainMetrics}
        />
      )}
    </div>
  );
}

export default App;