const EmptyState = () => {
  return (
    <div className="empty-state">
      <div className="empty-state__illustration" aria-hidden="true">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Notebook body */}
          <rect
            x="22"
            y="18"
            width="76"
            height="88"
            rx="4"
            fill="var(--surface-2)"
            stroke="var(--border)"
            strokeWidth="1.5"
          />
          {/* Spine */}
          <rect
            x="22"
            y="18"
            width="12"
            height="88"
            rx="4"
            fill="var(--accent)"
            opacity="0.25"
          />
          {/* Lines */}
          <line x1="42" y1="44" x2="86" y2="44" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="42" y1="58" x2="86" y2="58" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="42" y1="72" x2="70" y2="72" stroke="var(--border)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Pen */}
          <g transform="translate(72, 72) rotate(-35)">
            <rect x="-3" y="-22" width="6" height="36" rx="2" fill="var(--accent)" opacity="0.8" />
            <polygon points="-3,14 3,14 0,22" fill="var(--accent)" opacity="0.8" />
            <rect x="-3" y="-26" width="6" height="6" rx="1" fill="var(--text-muted)" opacity="0.5" />
          </g>
        </svg>
      </div>
      <h3 className="empty-state__heading">No notes yet</h3>
      <p className="empty-state__subtext">
        Write something down. Your first note is waiting.
      </p>
    </div>
  );
};

export default EmptyState;
