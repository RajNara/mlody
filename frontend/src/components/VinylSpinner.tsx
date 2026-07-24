import './VinylSpinner.css';

function VinylSpinner() {
  return (
    <svg viewBox="0 0 120 120" className="vinyl-spinner" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="60" cy="60" r="58" fill="#0d0d0d" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle cx="60" cy="60" r="34" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle cx="60" cy="60" r="26" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

      {/* glossy highlight arc */}
      <path
        d="M 24 34 A 46 46 0 0 1 96 34"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />

      {/* center label + spindle hole */}
      <circle cx="60" cy="60" r="19" fill="url(#vinylLabelGradient)" />
      <circle cx="60" cy="60" r="3.5" fill="#0a0a0a" />

      <defs>
        <linearGradient id="vinylLabelGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7928ca" />
          <stop offset="100%" stopColor="#4cd2f0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default VinylSpinner;