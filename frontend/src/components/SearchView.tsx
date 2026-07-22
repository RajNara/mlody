import { useState, type FormEvent } from 'react';
import { searchTracks, type Track } from '../api';

interface Props {
  likedSongs: Track[];
  dislikedSongs: Track[];
  onLike: (t: Track) => void;
  onDislike: (t: Track) => void;
  onRemove: (trackId: string, liked: boolean) => void;
  onContinue: () => void;
}

function SearchView({ likedSongs, dislikedSongs, onLike, onDislike, onRemove, onContinue }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await searchTracks(query, 3));
    } catch {
      setError('Search failed — check the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-view">
      <h1>Build your MLody 🧬</h1>
      <p className="subtitle">Search for songs to establish your baseline.</p>

      <form onSubmit={handleSearch} className="search-form">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a song name..." />
        <button type="submit" disabled={loading}>{loading ? 'Searching…' : 'Search 🔍'}</button>
      </form>
      {error && <p className="error-text">{error}</p>}

      <div className="results-list">
        {results.map((track) => (
          <div key={track.track_id} className="track-row">
            {track.artwork_url && <img src={track.artwork_url} alt={track.name} width={60} />}
            <div className="track-info">
              <strong>{track.name}</strong>
              <span>{track.artist}</span>
              {track.preview_url && <audio controls src={track.preview_url} />}
            </div>
            <button onClick={() => onLike(track)}>👍</button>
            <button onClick={() => onDislike(track)}>👎</button>
          </div>
        ))}
      </div>

      <div className="selections-panel">
        <h4>Your Selections</h4>

        <h5>💚 Likes</h5>
        {likedSongs.length === 0 && <p className="empty-hint">No songs added yet...</p>}
        {likedSongs.map((s) => (
          <div key={s.track_id} className="selection-row">
            <span>{s.name} — {s.artist}</span>
            <button onClick={() => onRemove(s.track_id, true)}>❌</button>
          </div>
        ))}

        <h5>❌ Dislikes</h5>
        {dislikedSongs.length === 0 && <p className="empty-hint">No songs added yet...</p>}
        {dislikedSongs.map((s) => (
          <div key={s.track_id} className="selection-row">
            <span>{s.name} — {s.artist}</span>
            <button onClick={() => onRemove(s.track_id, false)}>❌</button>
          </div>
        ))}

        <button disabled={likedSongs.length === 0} onClick={onContinue} className="continue-btn">
          Analyze & Continue ➡️
        </button>
      </div>
    </div>
  );
}

export default SearchView;