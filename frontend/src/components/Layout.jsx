import React from 'react';
import { Navbar } from './Navbar.jsx';
import { Sidebar } from './Sidebar.jsx';

export const Layout = ({ children }) => {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <main style={{
          flex: 1,
          backgroundColor: 'var(--bg-primary)',
          padding: '2rem',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%',
          overflowX: 'hidden'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

