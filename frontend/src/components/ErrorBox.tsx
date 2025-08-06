// src/components/ErrorBox.tsx
import React from 'react';

export const ErrorBox: React.FC<{ message: string }> = ({ message }) => (
  <div style={{
      color: '#8B0000',
      border: '1px solid #8B0000',
      padding: '1rem',
      borderRadius: '4px',
      backgroundColor: '#ffe5e5',
      margin: '1rem 0'
    }}>
    {message}
  </div>
);
