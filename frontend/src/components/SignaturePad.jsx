import React, { useEffect, useRef, useState } from 'react';

export default function SignaturePad({ label, value, onChange, disabled = false }) {
  const canvasRef = useRef(null); const [history, setHistory] = useState([]); const drawing = useRef(false); const last = useRef(null);
  useEffect(() => { const canvas=canvasRef.current; const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height); if(value){const image=new Image();image.onload=()=>ctx.drawImage(image,0,0,canvas.width,canvas.height);image.src=value;} }, [value]);
  const point = e => { const rect=canvasRef.current.getBoundingClientRect(); return {x:(e.clientX-rect.left)*(canvasRef.current.width/rect.width),y:(e.clientY-rect.top)*(canvasRef.current.height/rect.height)}; };
  const start = e => { if(disabled)return; drawing.current=true; last.current=point(e); canvasRef.current.setPointerCapture(e.pointerId); };
  const move = e => { if(!drawing.current||disabled)return; const p=point(e),ctx=canvasRef.current.getContext('2d');ctx.strokeStyle='#29211e';ctx.lineWidth=2.2;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.stroke();last.current=p; };
  const end = () => { if(!drawing.current)return;drawing.current=false;setHistory(h=>[...h,canvasRef.current.toDataURL()]); };
  const clear = () => { if(disabled)return;setHistory([]);onChange(''); };
  const redo = () => { if(disabled||!history.length)return;onChange(history[history.length-1]);setHistory(h=>h.slice(0,-1)); };
  const save = () => { if(!disabled)onChange(canvasRef.current.toDataURL()); };
  return <div className="signature-pad"><label>{label}</label><canvas ref={canvasRef} width="560" height="150" onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end}/><div className="signature-line">Signature</div>{!disabled&&<div className="signature-actions no-print"><button type="button" onClick={clear}>Clear</button><button type="button" onClick={redo} disabled={!history.length}>Redo</button><button type="button" onClick={save}>Save Signature</button></div>}</div>;
}
