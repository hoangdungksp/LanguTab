import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { CalBox } from './catalog';
import { getCalibration, saveCalibration, deleteCalibration } from './examApi';

/**
 * Fullscreen calibration editor: drag/resize the boxes (drop zones for the
 * drag part, colour regions for the colour part) over the scene image, then
 * save. Positions are 0-1 fractions of the image.
 */
export function CalibrateEditor({ levelId, partId, imageUrl, defaults, onClose }: {
  levelId: string; partId: string; imageUrl: string; defaults: CalBox[]; onClose: () => void;
}) {
  const [boxes, setBoxes] = useState<CalBox[]>(defaults.map((b) => ({ ...b })));
  const [sel, setSel] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const wrap = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{ id: string; mode: 'move' | 'resize'; px: number; py: number; box: CalBox } | null>(null);

  // Seed from any saved override.
  useEffect(() => {
    getCalibration(levelId, partId).then((zones) => {
      if (!zones.length) return;
      setBoxes((prev) => prev.map((b) => {
        const z = zones.find((x) => x.zone_id === b.id);
        return z ? { ...b, x: z.x, y: z.y, width: z.width, height: z.height } : b;
      }));
    }).catch(() => {});
  }, [levelId, partId]);

  const frac = (e: PointerEvent) => {
    const r = wrap.current!.getBoundingClientRect();
    return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
  };

  const onDown = (id: string, mode: 'move' | 'resize') => (e: PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    setSel(id);
    wrap.current?.setPointerCapture(e.pointerId);
    const box = boxes.find((b) => b.id === id)!;
    const { fx, fy } = frac(e);
    drag.current = { id, mode, px: fx, py: fy, box: { ...box } };
  };

  const onMove = (e: PointerEvent) => {
    const d = drag.current; if (!d) return;
    const { fx, fy } = frac(e);
    const dx = fx - d.px, dy = fy - d.py;
    const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
    setBoxes((prev) => prev.map((b) => {
      if (b.id !== d.id) return b;
      if (d.mode === 'move') {
        return { ...b, x: clamp(d.box.x + dx, 0, 1 - b.width), y: clamp(d.box.y + dy, 0, 1 - b.height) };
      }
      return { ...b, width: clamp(d.box.width + dx, 0.03, 1 - b.x), height: clamp(d.box.height + dy, 0.03, 1 - b.y) };
    }));
  };
  const onUp = () => { drag.current = null; };

  const save = async () => {
    setMsg('Đang lưu…');
    try {
      await saveCalibration(levelId, partId, boxes.map((b) => ({ zone_id: b.id, x: b.x, y: b.y, width: b.width, height: b.height })));
      setMsg('✓ Đã lưu vị trí');
    } catch (e) { setMsg('✗ ' + (e instanceof Error ? e.message : String(e))); }
  };
  const reset = async () => {
    setMsg('Đang khôi phục…');
    try { await deleteCalibration(levelId, partId); setBoxes(defaults.map((b) => ({ ...b }))); setMsg('✓ Đã về vị trí mặc định'); }
    catch (e) { setMsg('✗ ' + (e instanceof Error ? e.message : String(e))); }
  };

  return (
    <div className="lightbox" style={{ flexDirection: 'column', cursor: 'default' }}>
      <div className="cal-toolbar">
        <b>Chỉnh vị trí — {partId}</b>
        <span className="muted">Kéo ô để di chuyển · kéo góc ◢ để đổi kích thước</span>
        <span className="spacer" />
        {msg && <span className="muted">{msg}</span>}
        <button className="btn sm" onClick={reset}>Khôi phục mặc định</button>
        <button className="btn sm primary" onClick={save}>Lưu vị trí</button>
        <button className="btn sm" onClick={onClose}>✕ Đóng</button>
      </div>
      <div
        ref={wrap}
        className="cal-wrap"
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      >
        <img src={imageUrl} alt="" draggable={false} />
        {boxes.map((b) => (
          <div
            key={b.id}
            className={`cal-box ${sel === b.id ? 'sel' : ''}`}
            style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%`, width: `${b.width * 100}%`, height: `${b.height * 100}%` }}
            onPointerDown={onDown(b.id, 'move')}
          >
            <span className="cal-label">{b.label || b.id}</span>
            <span className="cal-handle" onPointerDown={onDown(b.id, 'resize')} />
          </div>
        ))}
      </div>
    </div>
  );
}
