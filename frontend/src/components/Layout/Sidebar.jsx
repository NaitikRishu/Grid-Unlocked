const items = [
  'Live map shell',
  'FastAPI proxy',
  'Phase 1 cleaned datasets',
  'MapmyIndia credential path',
]

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="panel">
        <p className="panel__label">Current Build</p>
        <h2>Runnable baseline</h2>
        <p className="panel__text">
          This shell gives the team a working frontend and backend handshake before the
          deeper simulation phases land.
        </p>
      </div>

      <div className="panel">
        <p className="panel__label">Included</p>
        <ul className="checklist">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </aside>
  )
}

export default Sidebar
