import React from 'react';
import { navConfig } from './utils/navConfig';
import { NavBar } from './components/NavBar';

const App: React.FC = () => {
  return (
    <div>
      <NavBar items={navConfig} /> {/* NavBar with navigation items from navConfig */}
      <div style={{ padding: '1rem' }}>
        <h1>Welcome to the App</h1>
        <p>This is a sample React application with authentication and toast notifications.</p>
      </div>
    </div>
  );
};

export default App;
