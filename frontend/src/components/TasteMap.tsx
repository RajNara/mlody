import { useEffect, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ComposedChart, Bar, Line, BarChart, Cell, Legend,
} from 'recharts';
import { getVisualization, type ModelVisualization, type TrainingPoint } from '../api';
import InfoTooltip from '../assets/InfoTooltip';
import './TasteMap.css';

interface Props {
  sessionId: string;
  onContinue: () => void;
}

const LABEL_COLORS: Record<string, string> = {
  liked: '#34d399',
  disliked: '#fb7185',
};
const LABEL_NAMES: Record<string, string> = {
  liked: 'Liked',
  disliked: 'Disliked',
};

function pointsForPair(points: TrainingPoint[], xIdx: number, yIdx: number) {
  const grouped: Record<string, (TrainingPoint & { x: number; y: number })[]> = {};
  for (const p of points) {
    const entry = { ...p, x: p.coordinates[xIdx], y: p.coordinates[yIdx] };
    (grouped[p.label] ??= []).push(entry);
  }
  return grouped;
}

function TasteMap({ sessionId, onContinue }: Props) {
  const [data, setData] = useState<ModelVisualization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    getVisualization(sessionId)
      .then(setData)
      .catch(() => setError('Could not load your taste model visualization.'));
  }, [sessionId]);

  if (error) {
    return (
      <div className="taste-map-view">
        <p className="error-text">{error}</p>
        <button className="btn-modern btn-modern-primary" onClick={onContinue}>Continue</button>
      </div>
    );
  }
  if (!data) {
    return <div className="taste-map-view"><p className="empty-hint">Loading your taste model…</p></div>;
  }

  const scree = data.explained_variance.map((v, i) => ({
    component: `Dimension ${i + 1}`,
    variance: v * 100,
    cumulative: data.cumulative_variance[i] * 100,
  }));

  return (
    <div className="taste-map-view">
      <div className="page-header">
        <h1 className="mlody-heading">Your Taste Model</h1>
        <p className="subtitle">
          Here's how MLody mapped the songs you rated, and how it learned to tell them apart.
        </p>
      </div>

      <div className="glass-card taste-map-card">
        <h2>
          The Taste Map
          <InfoTooltip text="Each song has 250+ measurements about its sound. We simplified those down to a handful of traits and plotted your rated songs against pairs of them below. Songs that sound similar sit closer together." />
        </h2>

        <div className="taste-map-grid">
          {data.graph_pairs.map(([xIdx, yIdx]) => {
            const grouped = pointsForPair(data.training_points, xIdx, yIdx);
            const axisX = data.axes[xIdx];
            const axisY = data.axes[yIdx];
            return (
              <div key={`${xIdx}-${yIdx}`} className="taste-map-mini">
                <h3>{axisX.label} vs. {axisY.label}</h3>
                <ResponsiveContainer width="100%" height={320}>
                  <ScatterChart margin={{ top: 10, right: 20, bottom: 55, left: 50 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      type="number"
                      dataKey="x"
                      tick={{ fill: '#888', fontSize: 10 }}
                      label={{ value: axisX.label, position: 'insideBottom', dy: 22, fill: '#aaa', fontSize: 11 }}
                    />
                    <YAxis
                      type="number"
                      dataKey="y"
                      tick={{ fill: '#888', fontSize: 10 }}
                      label={{ value: axisY.label, angle: -90, position: 'insideLeft', dx: -8, fill: '#aaa', fontSize: 11 }}
                    />
                    <ZAxis range={[45, 45]} />
                    <RechartsTooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const p = payload[0].payload as TrainingPoint & { x: number; y: number };
                        return (
                          <div className="taste-map-tooltip">
                            <strong>{p.track_name}</strong>
                            <span>{p.artist}</span>
                            <span style={{ color: LABEL_COLORS[p.label] }}>{LABEL_NAMES[p.label]}</span>
                          </div>
                        );
                      }}
                    />
                    <Legend
                      formatter={(value) => LABEL_NAMES[value] ?? value}
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ fontSize: 11, bottom: 15 }}
                    />
                    {Object.entries(grouped).map(([label, points]) => (
                      <Scatter key={label} name={label} data={points} fill={LABEL_COLORS[label]} />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="taste-map-graph-desc">
                  <p><strong>{axisX.label}:</strong> {axisX.description}</p>
                  <p><strong>{axisY.label}:</strong> {axisY.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="details-toggle" onClick={() => setShowDetails((s) => !s)}>
        {showDetails ? 'Hide the details ▲' : 'How this works ▼'}
      </button>

      {showDetails && (
        <div className="taste-map-details">
          <div className="glass-card taste-map-card">
            <h2>
              How Much Each Dimension Explains
              <InfoTooltip text="We simplified your songs' 250+ measurements down to a handful of dimensions. This shows how much of the original information each one keeps, and the running total." />
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={scree} margin={{ bottom: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="component" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} unit="%" />
                <RechartsTooltip contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }}
                  formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : ''} />
                <Bar dataKey="variance" fill="#4cd2f0" name="Information kept" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="cumulative" stroke="#f472b6" strokeWidth={2} dot={false} name="Running total" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card taste-map-card">
            <h2>
              What Shapes {data.axes[0]?.label} &amp; {data.axes[1]?.label}
              <InfoTooltip text="Each dimension is really a blend of many audio traits. This shows which traits matter most for each one." />
            </h2>
            <div className="loadings-grid">
              <div>
                <h3>{data.axes[0]?.label}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.top_loadings_pc1} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis type="category" dataKey="feature" width={150} tick={{ fill: '#ccc', fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="pc1_loading" radius={[0, 4, 4, 0]}>
                      {data.top_loadings_pc1.map((entry, i) => (
                        <Cell key={i} fill={entry.pc1_loading >= 0 ? '#4cd2f0' : '#7928ca'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h3>{data.axes[1]?.label}</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={data.top_loadings_pc2} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
                    <YAxis type="category" dataKey="feature" width={150} tick={{ fill: '#ccc', fontSize: 11 }} />
                    <RechartsTooltip contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <Bar dataKey="pc2_loading" radius={[0, 4, 4, 0]}>
                      {data.top_loadings_pc2.map((entry, i) => (
                        <Cell key={i} fill={entry.pc2_loading >= 0 ? '#4cd2f0' : '#7928ca'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="glass-card taste-map-card">
            <h2>
              How Much Each Dimension Mattered
              <InfoTooltip text="Once your songs were placed on the map, we weighed each dimension by how well it separated liked from disliked." />
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.coefficients.map((c) => ({ name: `Dim ${c.component + 1}`, value: c.coefficient }))}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                <RechartsTooltip contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.coefficients.map((c, i) => (
                    <Cell key={i} fill={c.coefficient >= 0 ? '#34d399' : '#fb7185'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <button className="btn-modern btn-modern-primary taste-map-continue" onClick={onContinue}>
        Continue →
      </button>
    </div>
  );
}

export default TasteMap;