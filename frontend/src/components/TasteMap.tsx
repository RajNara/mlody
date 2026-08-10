import { useEffect, useState } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, ComposedChart, Bar, Line, BarChart, Cell, Legend,
} from 'recharts';
import { getVisualization, type ModelVisualization, type TrainingPoint, type ComponentLoading } from '../api';
import InfoTooltip from '../assets/InfoTooltip';
import './TasteMap.css';

interface Props {
  sessionId: string;
  onContinue: () => void;
}

const LABEL_COLORS: Record<string, string> = { liked: '#34d399', disliked: '#fb7185' };
const LABEL_NAMES: Record<string, string> = { liked: 'Liked', disliked: 'Disliked' };

function pointsForPair(points: TrainingPoint[], xIdx: number, yIdx: number) {
  const grouped: Record<string, (TrainingPoint & { x: number; y: number })[]> = {};
  for (const p of points) {
    const entry = { ...p, x: p.coordinates[xIdx], y: p.coordinates[yIdx] };
    (grouped[p.label] ??= []).push(entry);
  }
  return grouped;
}

function withRank(items: ComponentLoading[]) {
  return items.map((item, i) => ({ ...item, rank: `#${i + 1}` }));
}

function TasteMap({ sessionId, onContinue }: Props) {
  const [data, setData] = useState<ModelVisualization | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loadingFocus, setLoadingFocus] = useState<'pc1' | 'pc2'>('pc1');

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
  if (data.axes.length < 2) {
    return (
      <div className="taste-map-view">
        <p className="empty-hint">Not enough rated songs yet to build a taste map.</p>
        <button className="btn-modern btn-modern-primary" onClick={onContinue}>Continue</button>
      </div>
    );
  }

  const [axisX, axisY] = data.axes;
  const grouped = pointsForPair(data.training_points, 0, 1);

  const scree = data.explained_variance.map((v, i) => ({
    component: `PC${i + 1}`,
    variance: v * 100,
    cumulative: data.cumulative_variance[i] * 100,
  }));

  const loadingKey: 'pc1_loading' | 'pc2_loading' = loadingFocus === 'pc1' ? 'pc1_loading' : 'pc2_loading';
  const loadings = withRank(loadingFocus === 'pc1' ? data.top_loadings_pc1 : data.top_loadings_pc2);
  const loadingAxisLabel = loadingFocus === 'pc1' ? axisX.label : axisY.label;

  return (
    <div className="taste-map-view">
      <div className="page-header">
        <h1 className="mlody-heading">Your Taste Model</h1>
        <p className="subtitle">
          Here's how MLody mapped the songs you rated, and how it learned to tell them apart.
        </p>
      </div>

      <div className="glass-card taste-map-card taste-map-main-card">
        <h2>
          The Taste Map
          <InfoTooltip text="Each song has 250+ measurements about its sound. We simplified those down to the two most informative traits and plotted your rated songs against them. Songs that sound similar sit closer together." />
        </h2>
        <h3>{axisX.label} vs. {axisY.label}</h3>
        <ResponsiveContainer width="100%" height={440}>
          <ScatterChart margin={{ top: 10, right: 30, bottom: 55, left: 60 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis
              type="number" dataKey="x" tick={{ fill: '#888', fontSize: 11 }}
              label={{ value: axisX.label, position: 'insideBottom', dy: 24, fill: '#aaa', fontSize: 12 }}
            />
            <YAxis
              type="number" dataKey="y" tick={{ fill: '#888', fontSize: 11 }}
              label={{ value: axisY.label, angle: -90, position: 'insideLeft', dx: -10, fill: '#aaa', fontSize: 12 }}
            />
            <ZAxis range={[70, 70]} />
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
              verticalAlign="bottom" align="center"
              wrapperStyle={{ fontSize: 12, bottom: 15 }}
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

      <button className="details-toggle" onClick={() => setShowDetails((s) => !s)}>
        {showDetails ? 'Hide the details ▲' : 'How this works ▼'}
      </button>

      {showDetails && (
        <div className="taste-map-details">
          <div className="glass-card taste-map-card pca-explainer">
            <h2>How We Got From 250+ Numbers to 2</h2>
            <p>
              Every song is first turned into 250+ raw audio measurements — tempo, MFCCs (tone
              shape), spectral brightness, chroma (pitch/harmony), loudness, and more. That's too
              many dimensions to plot, and too many for a classifier to learn well from just a
              handful of rated songs.
            </p>
            <p>
              We standardize every feature (zero mean, unit variance) and run{' '}
              <strong>Principal Component Analysis (PCA)</strong>. PCA builds new axes —
              <em> components</em> — as linear combinations of the original features, ordered so
              each one captures as much of the remaining variation as possible. The classifier
              trains on the first 15 components; the map above only plots the first 2, since
              that's what a scatter plot can actually show.
            </p>
          </div>

          <div className="glass-card taste-map-card">
            <h2>
              How Much Each Component Explains
              <InfoTooltip text="Each principal component captures a share of the total variation across your rated songs' audio features. The line is the running total across the 15 components used for training." />
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={scree} margin={{ bottom: 10 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="component" tick={{ fill: '#888', fontSize: 11 }} />
                <YAxis tick={{ fill: '#888', fontSize: 11 }} unit="%" />
                <RechartsTooltip
                  contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }}
                  formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : ''}
                />
                <Bar dataKey="variance" fill="#4cd2f0" name="Information kept" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="cumulative" stroke="#f472b6" strokeWidth={2} dot={false} name="Running total" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card taste-map-card">
            <h2>
              What Shapes Each Axis
              <InfoTooltip text="A 'loading' is how strongly a raw audio feature contributes to a component, and in which direction. Bigger bars either way mean that feature matters more for that axis." />
            </h2>
            <div className="loadings-toggle">
              <button className={loadingFocus === 'pc1' ? 'active' : ''} onClick={() => setLoadingFocus('pc1')}>
                {axisX.label}
              </button>
              <button className={loadingFocus === 'pc2' ? 'active' : ''} onClick={() => setLoadingFocus('pc2')}>
                {axisY.label}
              </button>
            </div>
            <div className="loadings-panel">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={loadings} layout="vertical" margin={{ left: 10, right: 10 }}>
                  <XAxis type="number" tick={{ fill: '#888', fontSize: 11 }} />
                  <YAxis type="category" dataKey="rank" width={34} tick={{ fill: '#ccc', fontSize: 11 }} />
                  <RechartsTooltip
                    contentStyle={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.1)' }}
                    formatter={(value: number | string | readonly (number | string)[] | undefined) => {
                      if (typeof value === 'number') {
                        return value.toFixed(3);
                      }
                      if (typeof value === 'string') {
                        return value;
                      }
                      return '';
                    }}
                    labelFormatter={(label) => loadings.find((l) => l.rank === label)?.feature ?? label}
                  />
                  <Bar dataKey={loadingKey} radius={[0, 4, 4, 0]}>
                    {loadings.map((entry, i) => (
                      <Cell key={i} fill={entry[loadingKey] >= 0 ? '#4cd2f0' : '#7928ca'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <ol className="loadings-legend">
                {loadings.map((item, i) => (
                  <li key={i}>
                    <span className={`loadings-dot ${item[loadingKey] >= 0 ? 'pos' : 'neg'}`} />
                    <span className="loadings-feature">{item.feature}</span>
                    <span className="loadings-value">{item[loadingKey].toFixed(3)}</span>
                  </li>
                ))}
              </ol>
            </div>
            <p className="loadings-caption">
              Bars pointing right (cyan) push a song higher on <strong>{loadingAxisLabel}</strong>;
              bars pointing left (purple) push it lower.
            </p>
          </div>

          <div className="glass-card taste-map-card">
            <h2>
              How Much Each Component Mattered To Your Model
              <InfoTooltip text="Once your rated songs were placed in PCA space, we trained a logistic regression classifier on all 15 components. This shows each component's learned weight — how much it pushes the model toward 'liked' or 'disliked.'" />
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.coefficients.map((c) => ({ name: `PC${c.component + 1}`, value: c.coefficient }))}>
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