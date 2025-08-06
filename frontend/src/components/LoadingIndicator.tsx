// src/components/LoadingIndicator.tsx
import React, { useState, useEffect } from 'react';

// returns loading component with animated dots
export const LoadingIndicator: React.FC = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return <span>Loading{dots}</span>;
};
