import { useEffect, useState } from 'react';
import VinylSpinner from './VinylSpinner';
import './IntroView.css';

interface Props {
  onDone: () => void;
}

const MESSAGES = [
  "Time to personalize your music experience.",
  "Tell us what belongs in your playlist, and what doesn't.",
  "We'll learn your taste and recommend your next favorites."
];

function IntroView({ onDone }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= MESSAGES.length) {
      onDone();
      return;
    }
    const timer = setTimeout(() => setIndex((i) => i + 1), 3600);
    return () => clearTimeout(timer);
  }, [index, onDone]);

  return (
    <div className="intro-container">
      <VinylSpinner />
      {index < MESSAGES.length && (
        <h1 key={index} className="intro-text">
          {MESSAGES[index]}
        </h1>
      )}
    </div>
  );
}

export default IntroView;