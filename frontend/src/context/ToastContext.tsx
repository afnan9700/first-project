// src/context/ToastContext.tsx
import React, { createContext, useContext, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

// a variable of type ToastType can be 'success', 'error', or 'info'
type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// type of the value provided by the context
interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ToastProvider component to wrap around the app
// ToastProvider provides the showToast function
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // function add new toast to the toast array state, tracks the added toast ID, and auto-removes it after 3 seconds
  // function call triggers a re-render to display the new toast
  const showToast = (message: string, type: ToastType = 'info') => {
    const id = uuidv4();  // generate a unique ID for the toast
    const toast: Toast = { id, message, type };
    setToasts((prev) => [...prev, toast]);

    // Auto-remove toast after 3 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };
  
  return (  
    <ToastContext.Provider value={{ showToast }}>
      {children /* Render children components wrapped in ToastProvider */}
      {/* Render the toast stack */}
      <div style={{  // styling the toast container
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        {toasts.map((toast) => (  // rendering each toast
          <div key={toast.id} style={{
            padding: '0.75rem 1rem',
            borderRadius: '4px',
            color: '#fff',
            backgroundColor: {
              success: '#4caf50',
              error: '#f44336',
              info: '#2196f3'
            }[toast.type],
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            minWidth: '200px'
          }}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook to use the ToastContext
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};
