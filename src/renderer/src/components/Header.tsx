import React from 'react';
import './Header.css';

interface HeaderProps {
  onConfigClick: () => void;
}

function Header({ onConfigClick }: HeaderProps) {
  return (
    <header className="header">
      <h1>AI Triage Assistant</h1>
      <button className="config-button" onClick={onConfigClick}>
        ⚙️ Config
      </button>
    </header>
  );
}

export default Header;