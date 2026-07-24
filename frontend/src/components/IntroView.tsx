import { useEffect, useState } from 'react';
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
    <>
      <div className="pulse-container">
        <div className="pulse-circle pulse-1" />
        <div className="pulse-circle pulse-2" />
        <div className="pulse-circle pulse-3" />
      </div>
      {index < MESSAGES.length && (
        <div className="intro-container">
          <h1 key={index} className="intro-text">
            {MESSAGES[index]}
          </h1>
        </div>
      )}
    </>
  );
}

export default IntroView;