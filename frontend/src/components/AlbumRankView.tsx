import { useState, type FormEvent } from 'react';
import { searchAlbums, rankAlbum, type Album, type AlbumRankResponse } from '../api';
import { IconSearch } from '../assets/Icons';
import TrackPlayer from './TrackPlayer';
import VinylSpinner from './VinylSpinner';
import './AlbumRankView.css';

interface Props {
  sessionId: string;
}

type Phase = 'search' | 'ranking' | 'ranked';

function formatPercent(p: number | null): string {
  return p === null ? '—' : `${Math.round(p * 100)}%`;
}

function AlbumRankView({ sessionId }: Props) {
  const [query, setQuery] = useState('');
  const [albums, setAlbums] = useState<Album[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [phase, setPhase] = useState<Phase>('search');
  const [result, setResult] = useState<AlbumRankResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      setAlbums(await searchAlbums(query));
      setHasSearched(true);
    } catch {
      setError('Album search failed — check the backend is running.');
    } finally {
      setSearching(false);
    }
  };

  const handleSelectAlbum = async (album: Album) => {
    setPhase('ranking');
    setError(null);
    try {
      const data = await rankAlbum(album.album_id, sessionId);
      setResult(data);
      setPhase('ranked');
    } catch {
      setError('Could not rank this album — try another one.');
      setPhase('search');
    }
  };

  const reset = () => {
    setResult(null);
    setPhase('search');
    setAlbums([]);
    setHasSearched(false);
    setQuery('');
  };

  if (phase === 'ranking') {
    return (
      <div className="album-rank-view">
        <div className="album-rank-status">
          <VinylSpinner />
          <p className="album-rank-status-text">Scoring every track against your MLody…</p>
        </div>
      </div>
    );
  }

  if (phase === 'ranked' && result) {
    return (
      <div className="album-rank-view">
        <div className="page-header">
          <h1 className="mlody-heading">Album Ranked</h1>
          <p className="subtitle">
            Every track on <strong>{result.album.title}</strong> by {result.album.artist},
            ordered by how likely your MLody thinks you are to like it.
          </p>
        </div>

        <div className="glass-card album-rank-card">
          {result.album.cover_url && (
            <div className="album-rank-cover-row">
              <img src={result.album.cover_url} alt={result.album.title} />
              <div>
                <h2>{result.album.title}</h2>
                <p>{result.album.artist}</p>
              </div>
            </div>
          )}

          <ol className="album-rank-list">
            {result.ranked_tracks.map((rt, i) => (
              <li key={rt.track.track_id} className="album-rank-row">
                <span className="album-rank-position">{i + 1}</span>
                <div className="album-rank-info">
                  <strong>{rt.track.name}</strong>
                  {rt.track.preview_url ? (
                    <TrackPlayer src={rt.track.preview_url} />
                  ) : (
                    <span className="empty-hint">No preview available</span>
                  )}
                </div>
                <span
                  className={
                    'album-rank-score' +
                    (rt.like_probability !== null && rt.like_probability >= 0.5
                      ? ' album-rank-score-positive'
                      : rt.like_probability !== null
                        ? ' album-rank-score-negative'
                        : '')
                  }
                >
                  {formatPercent(rt.like_probability)}
                </span>
              </li>
            ))}
          </ol>
        </div>

        <button className="details-toggle" onClick={() => setShowDetails((s) => !s)}>
          {showDetails ? 'Hide the details ▲' : 'How was this ranked? ▼'}
        </button>

        {showDetails && (
          <div className="album-rank-details glass-card">
            <h2>What the Percentage Means</h2>
            <p>
              Each percentage is your classifier's <strong>predicted probability that you'd like
              this track</strong>, based on everything it learned from the songs you liked and
              disliked earlier. It's not a similarity score to any one song — it's the model's
              confidence after weighing all 250+ audio traits (tempo, tone, texture, harmony,
              loudness) the same way it weighed them for your training data.
            </p>
            <p>
              A score near <strong>100%</strong> means this track's audio profile lands firmly on
              the "liked" side of what your MLody learned. A score near <strong>0%</strong> means
              it lands firmly on the "disliked" side. Scores near <strong>50%</strong> mean the
              model is genuinely unsure — the track doesn't clearly resemble either group.
            </p>

            <h2>Why Some Songs Rank Higher</h2>
            <p>
              Under the hood, each track is reduced from its raw audio measurements down to the
              same 15 components you saw on the Taste Map — the same compressed representation
              your liked and disliked songs were plotted in. A track ranks higher when its
              position in that space sits closer to where your liked songs clustered, and lower
              when it sits closer to your dislikes.
            </p>
            <p>
              In practice, this usually tracks with the traits your Taste Map called out as most
              important — tracks that share your liked songs' tempo range, brightness, or harmonic
              complexity tend to score higher, even if you've never heard them before.
            </p>
            <p className="album-rank-details-caveat">
              A missing score ("—") just means we couldn't get an audio preview for that track —
              it's not counted as a low match, it simply couldn't be scored.
            </p>
          </div>
        )}

        <button className="btn-modern btn-modern-primary" onClick={reset}>
          Rank another album
        </button>
      </div>
    );
  }
  
  return (
    <div className="album-rank-view">
      <div className="page-header">
        <h1 className="mlody-heading">Rank an Album</h1>
        <p className="subtitle">
          Search for an album and MLody will rank every track from most to least likely to match
          your taste.
        </p>
      </div>

      <form onSubmit={handleSearch} className="search-form album-rank-search-form">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Album name..."
        />
        <button type="submit" disabled={searching} className="btn-modern btn-modern-primary">
          <IconSearch size={14} />
          {searching ? 'Searching…' : 'Search'}
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}

      <div className="album-rank-results">
        {!hasSearched && (
          <p className="empty-hint">Search for an album above to get started.</p>
        )}
        {hasSearched && albums.length === 0 && (
          <p className="empty-hint">No albums found — try another search.</p>
        )}
        {albums.map((album) => (
          <button
            key={album.album_id}
            className="album-rank-option glass-card"
            onClick={() => handleSelectAlbum(album)}
          >
            {album.cover_url && <img src={album.cover_url} alt={album.title} />}
            <div>
              <strong>{album.title}</strong>
              <span>{album.artist}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default AlbumRankView;