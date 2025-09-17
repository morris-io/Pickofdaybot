// components/PercentageCounter.js
import { useState, useEffect } from 'react';
import styled from 'styled-components';

const CounterSpan = styled.span`
  font-size: 1.05rem; /* Match the HeroText font size */
  font-weight: 700;
  color: #1f2937; /* A dark color for contrast */
  font-family: 'monospace';
  
  /* The glow effect you requested */
  text-shadow: 0 0 5px rgba(31, 41, 55, 0.5);
  display: inline; /* Keep it inline with the text */
`;

export default function PercentageCounter({ targetPercentage }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const steps = 100;
    const increment = targetPercentage / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= targetPercentage) {
        setCount(targetPercentage);
        clearInterval(timer);
      } else {
        setCount(Math.round(start));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [targetPercentage]);

  return (
    <CounterSpan>
      {count}%
    </CounterSpan>
  );
}