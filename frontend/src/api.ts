const API_BASE = 'http://localhost:8000';

export interface Track {
  track_id: string;
  name: string;
  artist: string;
  artwork_url?: string | null;
  preview_url?: string | null;
}

interface SearchResponse { results: Track[]; }
interface QuizResponse { tracks: Track[]; }
interface TrainResponse { session_id: string; status: string; metrics: Record<string, unknown>; }

export interface TrainProgress {
  done: number;
  total: number;
  status: 'not_started' | 'in_progress' | 'complete' | 'error';
  metrics?: Record<string, unknown> | null;
}

export async function searchTracks(query: string, artist = '', limit = 3): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, artist: artist || null, limit }),
  });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);
  return (await res.json() as SearchResponse).results;
}

export async function getQuizTracks(): Promise<Track[]> {
  const res = await fetch(`${API_BASE}/quiz`);
  if (!res.ok) throw new Error(`Quiz fetch failed: ${res.status}`);
  return (await res.json() as QuizResponse).tracks;
}

export async function selectTrack(sessionId: string, track: Track, liked: boolean): Promise<void> {
  const res = await fetch(`${API_BASE}/select`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, track, liked }),
  });
  if (!res.ok) throw new Error(`Selection failed: ${res.status}`);
}

// legacy training call
export async function trainModel(sessionId: string): Promise<TrainResponse> {
  const res = await fetch(`${API_BASE}/train`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (res.status !== 200 && res.status !== 404) throw new Error(`Train failed: ${res.status}`);
  return res.json();
}

export async function startTraining(sessionId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/train/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId }),
  });
  if (!res.ok) throw new Error(`Train start failed: ${res.status}`);
}

export async function getTrainProgress(sessionId: string): Promise<TrainProgress> {
  const res = await fetch(`${API_BASE}/train/progress/${sessionId}`);
  if (!res.ok) throw new Error(`Train progress failed: ${res.status}`);
  return res.json();
}

export async function pollTrainProgress(
  sessionId: string,
  onUpdate: (p: { done: number; total: number }) => void,
): Promise<Record<string, unknown>> {
  for (;;) {
    const progress = await getTrainProgress(sessionId);
    onUpdate({ done: progress.done, total: progress.total });

    if (progress.status === 'complete') {
      return progress.metrics ?? {};
    }
    if (progress.status === 'error') {
      throw new Error('Training failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
}