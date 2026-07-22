interface Props {
  likeCount: number;
  dislikeCount: number;
  metrics: Record<string, unknown> | null;
}

function CompleteView({ likeCount, dislikeCount, metrics }: Props) {
  return (
    <div className="complete-view">
      <h1>Profile Built.</h1>
      <p>Your Audio DNA has been sequenced — we now understand your taste much better.</p>
      <div className="stats-row">
        <div className="stat-chip"><div className="value">{likeCount}</div><div className="label">Likes</div></div>
        <div className="stat-chip"><div className="value">{dislikeCount}</div><div className="label">Dislikes</div></div>
        {metrics && (
          <div className="stat-chip">
            <div className="value">{String(metrics.train_accuracy ?? '—')}</div>
            <div className="label">Train Accuracy</div>
          </div>
        )}
      </div>
      {!metrics?.train_accuracy && (
        <p className="error-text">
          Training returned no accuracy metric — likely insufficient data (need a few likes and dislikes each).
        </p>
      )}
    </div>
  );
}

export default CompleteView;