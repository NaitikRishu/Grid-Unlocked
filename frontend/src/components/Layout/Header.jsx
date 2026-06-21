import React from 'react'

function Header({ activeTab, onTabChange }) {
  return (
    <header style={styles.header}>
      <div style={styles.leftSection}>
        <p className="text-eyebrow" style={styles.eyebrow}>GRID UNLOCKED</p>
        <h1 className="text-page-title" style={styles.title}>Traffic Intelligence Control Room</h1>
      </div>

      <div style={styles.rightSection}>
        <div style={styles.tabContainer}>
          <button
            onClick={() => onTabChange('operations')}
            style={activeTab === 'operations' ? { ...styles.tabBtn, ...styles.activeTab } : styles.tabBtn}
          >
            Live Operations Map
          </button>
          <button
            onClick={() => onTabChange('analytics')}
            style={activeTab === 'analytics' ? { ...styles.tabBtn, ...styles.activeTab } : styles.tabBtn}
          >
            Analytics Dashboard
          </button>
        </div>
      </div>
    </header>
  )
}

const styles = {
  header: {
    height: '56px',
    background: 'var(--bg-base)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
  },
  leftSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  eyebrow: {
    color: 'var(--accent)',
    marginBottom: '2px',
  },
  title: {
    fontSize: '16px', // Slightly smaller than default page title to fit header nicely
    margin: 0,
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
  },
  tabBtn: {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-secondary)',
    fontSize: '12px',
    fontWeight: 500,
    padding: '6px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    background: 'var(--accent-dim)',
    color: 'var(--accent)',
    border: '1px solid rgba(59,158,255,0.25)',
  },
}

export default Header
