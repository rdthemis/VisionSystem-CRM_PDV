// MenuToggleButton.jsx
import React, { useState } from 'react';
import './MenuToggleButton.css';

const MenuToggleButton = ({ isExpanded, onToggle }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="menu-toggle-container">
      <button
        onClick={onToggle}
        onMouseEnter={() => !isExpanded && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="menu-toggle-btn"
        aria-label={isExpanded ? 'Colapsar menu' : 'Expandir menu'}
      >
        <svg
          className={`arrow-icon ${isExpanded ? 'rotated' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {!isExpanded && showTooltip && (
        <div className="menu-tooltip">
          Expandir menu
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
};

export default MenuToggleButton;