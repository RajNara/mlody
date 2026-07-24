import './CompleteView.css';

interface Props {
  likeCount: number;
  dislikeCount: number;
  metrics: Record<string, unknown> | null;
}

function formatAccuracy(value: unknown): string {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '—';
}

function CompleteView({ likeCount, dislikeCount, metrics }: Props) {
  const hasAccuracy = typeof metrics?.train_accuracy === 'number';

  return (
    <div className="complete-view">
      <div className="complete-card glass-card">
        <div className="complete-badge">
          <span className="complete-badge-check">✓</span>
        </div>

        <h1>Profile Built.</h1>
        <p className="complete-subtitle">
          Your Audio DNA has been sequenced — we now understand your taste much better.
        </p>

        <div className="stats-row">
          <div className="stat-chip">
            <div className="value">{likeCount}</div>
            <div className="label">Likes</div>
          </div>
          <div className="stat-chip">
            <div className="value">{dislikeCount}</div>
            <div className="label">Dislikes</div>
          </div>
          {hasAccuracy && (
            <div className="stat-chip stat-chip-accent">
              <div className="value">{formatAccuracy(metrics?.train_accuracy)}</div>
              <div className="label">Train Accuracy</div>
            </div>
          )}
        </div>

        {!hasAccuracy && (
          <p className="error-text">
            Training returned no accuracy metric — likely insufficient data (need a few likes and dislikes each).
          </p>
        )}
      </div>
    </div>
  );
}

export default CompleteView;