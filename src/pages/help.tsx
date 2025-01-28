import React from 'react';

export const HelpContent = () => {
  return (
    <div style={{ padding: '16px' }}>
      <h2 style={{ 
        fontFamily: "'Pixelated MS Sans Serif', 'MS Sans Serif', sans-serif",
        fontSize: '14px',
        color: 'var(--win95-white)',
        marginBottom: '16px',
        padding: '4px 8px',
        background: 'var(--win95-blue)',
        boxShadow: 'inset -1px -1px 0 0 var(--win95-black), inset 1px 1px 0 0 var(--win95-button-highlight)'
      }}>
        Help
      </h2>
      <div style={{ 
        fontFamily: "'Pixelated MS Sans Serif', 'MS Sans Serif', sans-serif",
        fontSize: '12px',
        lineHeight: '1.5'
      }}>
        <p>Welcome to Nouns95! This is a Windows 95-style interface for interacting with Nouns DAO.</p>
        <br />
        <p>Available programs:</p>
        <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
          <li>Governance - View and participate in Nouns governance</li>
          <li>Studio - Create and customize your own Noun</li>
          <li>Auction - View and bid on the current Noun auction</li>
        </ul>
      </div>
    </div>
  );
};

const HelpPage = () => {
  return <HelpContent />;
};

export default HelpPage; 