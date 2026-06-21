import React from 'react'

function Header({ activeTab, onTabChange }) {
  return (
    <header className="stagger-navbar" style={styles.header}>
      <div style={styles.leftSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div className="radar-pulse"></div>
          <h1 style={styles.brandTitle}>
            GRID-<span style={styles.brandAccent}>UNLOCKED</span>
          </h1>
          <span style={styles.subtext}>Traffic Intelligence Control Room</span>
        </div>
      </div>

      <div style={styles.rightSection}>
        <div className="nav-tabs-wrapper">
          <button
            onClick={() => onTabChange('operations')}
            className={`nav-tab-button ${activeTab === 'operations' ? 'active' : ''}`}
          >
            Live Operations Map
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            className={`nav-tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            Analytics Dashboard
          </button>
          <div
            className="nav-tab-indicator"
            style={{
              left: activeTab === 'operations' ? '4px' : '176px',
              width: activeTab === 'operations' ? '152px' : '172px',
            }}
          />
        </div>

        <div className="status-ripple" style={{ marginLeft: '24px' }}>
          <div className="status-dot-wrapper">
            <div className="status-dot"></div>
            <div className="status-dot-ripple"></div>
          </div>
          <span>System status: Operational</span>
        </div>
      </div>
    </header>
  )
}

const styles = {
  header: {
    height: '68px',
    background: 'rgba(10, 10, 14, 0.75)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255, 0, 127, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '28px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
    color: 'var(--text-primary)',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    background: 'linear-gradient(to right, #ffffff, #f0e8f5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 0 12px var(--accent)',
  },
  brandAccent: {
    color: 'var(--accent)',
    background: 'linear-gradient(to right, #ffffff, #9ca3af)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: '900',
    marginLeft: '2px',
  },
  subtext: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    opacity: 0.8,
    marginLeft: '12px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
  },
}

export default Header
