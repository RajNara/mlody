import { useState, type SetStateAction } from 'react';
import LandingView from './components/LandingView';
import IntroView from './components/IntroView';
import SearchView from './components/SearchView';
import QuizView from './components/QuizView';
import TasteMap from './components/TasteMap';
import AlbumRankView from './components/AlbumRankView';
import { selectTrack, type Track } from './api';
import './App.css';

type ProfileStep = 'landing' | 'intro' | 'search' | 'quiz' | 'tastemap' | 'albums';

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

  const handleRemove = (trackId: string, liked: boolean) => {
    if (liked) setLikedSongs((prev) => prev.filter((s) => s.track_id !== trackId));
    else setDislikedSongs((prev) => prev.filter((s) => s.track_id !== trackId));
  };

  return (
    <div className="app-shell">
      {toast && <div className="toast" onClick={() => setToast(null)}>{toast}</div>}

      {step === 'landing' && (
        <LandingView onStart={() => setStep('intro')} />
      )}

      {step === 'intro' && (
        <IntroView onDone={() => setStep('search')} />
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
          onDone={(metrics) => { setTrainMetrics(metrics); setStep('tastemap'); }}
        />
      )}
      {step === 'tastemap' && (
        <TasteMap sessionId={sessionId} onContinue={() => setStep('albums')} />
      )}
      {step === 'albums' && <AlbumRankView sessionId={sessionId} />}
    </div>
  );
}

export default App;