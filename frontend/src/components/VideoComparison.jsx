import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

export default function VideoComparison({ before, after, clientName }) {
  const beforeRef = useRef(null);
  const afterRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');

  const playBoth = async () => {
    try {
      await Promise.all([beforeRef.current.play(), afterRef.current.play()]);
      setPlaying(true);
    } catch {
      beforeRef.current?.pause();
      afterRef.current?.pause();
      setPlaying(false);
    }
  };

  useEffect(() => {
    playBoth();
    const videos = [beforeRef.current, afterRef.current];
    return () => videos.forEach(video => video?.pause());
  }, [before, after]);

  const toggle = () => {
    if (playing) {
      beforeRef.current.pause();
      afterRef.current.pause();
      setPlaying(false);
    } else playBoth();
  };

  const failed = () => {
    beforeRef.current?.pause();
    afterRef.current?.pause();
    setPlaying(false);
    setError('A video could not be loaded. Check the video links or replace the file.');
  };

  return (
    <div className={`video-comparison ${playing ? '' : 'video-comparison-paused'}`}>
      <video ref={afterRef} src={after} aria-label={`After video for ${clientName}`} muted loop playsInline preload="auto" onError={failed} />
      <div className="video-comparison-before" style={position === null ? undefined : { clipPath: `inset(0 ${100 - position}% 0 0)`, animation: 'none' }}>
        <video ref={beforeRef} src={before} aria-label={`Before video for ${clientName}`} muted loop playsInline preload="auto" onError={failed} />
      </div>
      <div className="tv-reveal-line" style={position === null ? undefined : { left: `${position}%`, animation: 'none' }}><span>↔</span></div>
      <span className="tv-label tv-label-before">BEFORE</span>
      <span className="tv-label tv-label-after">AFTER ✨</span>
      <div className="video-comparison-controls">
        <button type="button" onClick={toggle} disabled={!!error} aria-label={playing ? 'Pause both videos' : 'Play both videos'}>{playing ? <Pause size={18} /> : <Play size={18} />}</button>
        <label htmlFor="video-reveal">Before / After</label>
        <input id="video-reveal" aria-label="Reveal before and after videos" type="range" min="0" max="100" value={position ?? 50} onChange={event => setPosition(Number(event.target.value))} />
        <button type="button" onClick={() => setPosition(null)} aria-label="Automatic before and after reveal">Auto</button>
      </div>
      {error && <p className="video-comparison-error" role="alert">{error}</p>}
    </div>
  );
}
