import { useState, type FormEvent } from 'react';
import { searchTracks, type Track } from '../api';
import { IconThumbsUp, IconThumbsDown, IconX, IconArrowRight, IconSearch } from '../assets/Icons';
import TrackPlayer from './TrackPlayer';
import './SearchView.css';

interface Props {
  likedSongs: Track[];
  dislikedSongs: Track[];
  onLike: (t: Track) => void;
  onDislike: (t: Track) => void;
  onRemove: (trackId: string, liked: boolean) => void;
  onContinue: () => void;
}

function SearchView({ likedSongs, dislikedSongs, onLike, onDislike, onRemove, onContinue }: Props) {
  const [song, setSong] = useState('');
  const [artist, setArtist] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!song.trim() && !artist.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await searchTracks(song, artist, 3));
      setHasSearched(true);
    } catch {
      setError('Search failed — check the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const renderTasteList = (songs: Track[], liked: boolean) =>
    songs.length === 0 ? (
      <p className="empty-hint">No songs added yet…</p>
    ) : (
      songs.map((s, i) => (
        <div key={s.track_id}>
          <div className="selection-row">
            <span>{s.name} — {s.artist}</span>
            <button
              onClick={() => onRemove(s.track_id, liked)}
              className="icon-btn icon-btn-remove"
              aria-label="Remove"
            >
              <IconX size={13} />
            </button>
          </div>
          {i < songs.length - 1 && <hr className="sleek-divider" />}
        </div>
      ))
    );

  return (
    <div className="search-view">
      <div className="page-header">
        <h1 className="mlody-heading">Build your MLody</h1>
        <p className="subtitle">Tell us what you love (and what you don't) by searching for songs.</p>
      </div>

      <form onSubmit={handleSearch} className="search-form">
        <input value={song} onChange={(e) => setSong(e.target.value)} placeholder="Song name..." />
        <input value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="Artist (optional)" />
        <button type="submit" disabled={loading} className="btn-modern btn-modern-primary">
          <IconSearch size={14} />
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}

      <div className="build-grid">
        <div className="taste-column glass-card taste-column-dislike">
          <h3 className="taste-column-title taste-column-title-dislike">👎 Dislikes</h3>
          {renderTasteList(dislikedSongs, false)}
        </div>

        <div className="results-column glass-card">
          {!hasSearched && (
            <p className="empty-hint results-placeholder">Search for a song above to see results here.</p>
          )}
          {hasSearched && results.length === 0 && (
            <p className="empty-hint results-placeholder">No tracks found — try another search.</p>
          )}
          {results.map((track) => (
            <div key={track.track_id} className="track-row">
              {track.artwork_url && <img src={track.artwork_url} alt={track.name} />}
              <div className="track-info">
                <strong>{track.name}</strong>
                <span>{track.artist}</span>
                {track.preview_url && <TrackPlayer src={track.preview_url} />}
              </div>
              <button onClick={() => onLike(track)} className="icon-btn icon-btn-like" aria-label="Like">
                <IconThumbsUp size={17} />
              </button>
              <button onClick={() => onDislike(track)} className="icon-btn icon-btn-dislike" aria-label="Dislike">
                <IconThumbsDown size={17} />
              </button>
            </div>
          ))}
        </div>

        <div className="taste-column glass-card taste-column-like">
          <h3 className="taste-column-title taste-column-title-like">💚 Likes</h3>
          {renderTasteList(likedSongs, true)}
        </div>
      </div>

      {/* need at least one liked song before the classifier has a positive class to train on */}
      <button
        disabled={likedSongs.length === 0}
        onClick={onContinue}
        className="btn-modern btn-modern-primary continue-btn-bottom"
      >
        Analyze & Continue
        <IconArrowRight size={16} />
      </button>
    </div>
  );
}

export default SearchView;