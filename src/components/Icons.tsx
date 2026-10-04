// Icone disegnate a mano, in SVG, così non serve nessuna libreria esterna.

export function Star({ className = 'st' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.5l2.8 6.1 6.7.7-5 4.5 1.4 6.6L12 17l-5.9 3.4 1.4-6.6-5-4.5 6.7-.7z" />
    </svg>
  );
}

export const ActionIcon = {
  meal: <svg viewBox="0 0 32 32"><path className="ic-a" d="M16 4c3 0 13 16 13 20a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4C3 20 13 4 16 4z" /><rect className="ic-b" x="10" y="19" width="12" height="9" rx="1.5" /></svg>,
  drink: <svg viewBox="0 0 32 32"><path className="ic-a" d="M16 3c4 6 10 12 10 18a10 10 0 0 1-20 0c0-6 6-12 10-18z" /><path d="M11 21a5 5 0 0 0 5 5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>,
  play: <svg viewBox="0 0 32 32"><rect className="ic-a" x="4" y="4" width="11" height="11" rx="3" /><rect className="ic-b" x="17" y="4" width="11" height="11" rx="3" /><rect className="ic-b" x="4" y="17" width="11" height="11" rx="3" /><rect className="ic-a" x="17" y="17" width="11" height="11" rx="3" /></svg>,
  walk: <svg viewBox="0 0 32 32"><circle className="ic-a" cx="16" cy="12" r="9" /><rect className="ic-b" x="14" y="17" width="4" height="12" rx="2" /><circle className="ic-b" cx="7" cy="27" r="2.5" /><circle className="ic-b" cx="25" cy="27" r="2.5" /></svg>,
  cuddle: <svg viewBox="0 0 32 32"><path className="ic-a" d="M16 28S3 20 3 11.5A6.5 6.5 0 0 1 16 8a6.5 6.5 0 0 1 13 3.5C29 20 16 28 16 28z" /></svg>,
  bath: <svg viewBox="0 0 32 32"><circle className="ic-a" cx="12" cy="19" r="8" /><circle className="ic-b" cx="23" cy="10" r="5" /><circle className="ic-a" cx="25" cy="23" r="3" /></svg>,
  medicine: <svg viewBox="0 0 32 32"><g transform="rotate(-40 16 16)"><rect className="ic-b" x="4" y="11" width="24" height="10" rx="5" /><path className="ic-a" d="M16 11h7a5 5 0 0 1 0 10h-7z" /></g></svg>,
  light: <svg viewBox="0 0 32 32"><path className="ic-a" d="M20 4a12 12 0 1 0 8 19A11 11 0 0 1 20 4z" /><circle className="ic-b" cx="24" cy="8" r="1.6" /><circle className="ic-b" cx="27" cy="14" r="1.1" /></svg>
};

export const TabIcon = {
  casa: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.2 2.5 11h2.6v9.3h5.2v-5.6h3.4v5.6h5.2V11h2.6z" /></svg>,
  negozio: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7V6a6 6 0 0 1 12 0v1h3l-1.3 13.2A2 2 0 0 1 17.7 22H6.3a2 2 0 0 1-2-1.8L3 7zm2 0h8V6a4 4 0 0 0-8 0z" /></svg>,
  album: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3.5h11a3 3 0 0 1 3 3V21H7a3 3 0 0 1-3-3zm16 3h.5V21H19V6.5zM8 7.5v2h7v-2z" /></svg>
};
