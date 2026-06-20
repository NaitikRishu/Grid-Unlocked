import React from 'react'

function TimeOffsetSlider({ value, onChange }) {
  const getLabel = (val) => {
    if (val === 0) return 'On Time'
    const absVal = Math.abs(val)
    const hrs = Math.floor(absVal / 60)
    const mins = absVal % 60
    
    let timeStr = ''
    if (hrs > 0) timeStr += `${hrs} hr${hrs > 1 ? 's' : ''} `
    if (mins > 0) timeStr += `${mins} min${mins > 1 ? 's' : ''} `
    
    return val < 0 ? `${timeStr.trim()} earlier` : `${timeStr.trim()} later`
  }

  return (
    <div className="control-slider" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#a1a1aa' }}>
        <span>Start Time Offset</span>
        <span style={{ fontWeight: '700', color: '#ffffff' }}>{getLabel(value)}</span>
      </div>
      <input
        type="range"
        min="-120"
        max="120"
        step="15"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        style={{ width: '100%', accentColor: '#ffffff', cursor: 'pointer' }}
      />
    </div>
  )
}

export default TimeOffsetSlider
