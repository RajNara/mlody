import { useState } from 'react';
import './InfoTooltip.css';

interface Props {
  text: string;
}

function InfoTooltip({ text }: Props) {
  const [show, setShow] = useState(false);

  return (
    <span
      className="info-tooltip-wrapper"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
      tabIndex={0}
      role="button"
      aria-label="More info"
    >
      <span className="info-tooltip-icon">i</span>
      {show && <span className="info-tooltip-bubble">{text}</span>}
    </span>
  );
}

export default InfoTooltip;