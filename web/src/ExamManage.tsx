import { Fragment, useEffect, useMemo, useState } from 'react';
import { levelsFor, levelIdOf, partLabel, type CatLevel, type CatPart } from './catalog';
import {
  fetchSceneImage, generateScene, getScenePrompt, uploadScene,
  audioStatus, generateAudio, saveScript, deleteScript, scenesStatus, fetchAudio,
} from './examApi';

const planetOf = (n: number) =>
  n > 140 ? 'HSK3' : n > 120 ? 'HSK2' : n > 100 ? 'HSK1' : n > 40 ? 'Flyers' : n > 20 ? 'Movers' : 'Starters';
const displayNum = (n: number) => (n > 100 ? n - 100 : n);
const PLANETS: Record<'en' | 'zh', string[]> = { en: ['Starters', 'Movers', 'Flyers'], zh: ['HSK1', 'HSK2', 'HSK3'] };

/** Editor/admin section: manage exam levels in a table, edit one in a drawer. */
export function ExamManage() {
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const [q, setQ] = useState('');
  const [planet, setPlanet] = useState('');
  const [scenes, setScenes] = useState<Record<string, boolean>>({});
  const [audio, setAudio] = useState<Record<string, boolean>>({});
  const [scanning, setScanning] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [largeImg, setLargeImg] = useState<string | null>(null);
  const [bulk, setBulk] = useState<{ done: number; total: number } | null>(null);

  const levels = useMemo(() => levelsFor(lang), [lang]);
  const setAudioCached = (k: string, v: boolean) => setAudio((m) => ({ ...m, [k]: v }));

  // Image status (one bulk call, covers all langs).
  useEffect(() => { scenesStatus().then(setScenes).catch(() => {}); }, []);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return levels.filter((l) =>
      (!planet || planetOf(l.levelNumber) === planet) &&
      (!s || l.title.toLowerCase().includes(s) || String(displayNum(l.levelNumber)).includes(s)));
  }, [levels, q, planet]);

  const imgStat = (l: CatLevel) => {
    const withScene = l.parts.filter((p) => p.sceneId);
    return { done: withScene.filter((p) => scenes[p.sceneId!]).length, total: withScene.length };
  };
  const audStat = (l: CatLevel) => {
    const checked = l.parts.filter((p) => p.audioKey in audio);
    return { done: checked.filter((p) => audio[p.audioKey]).length, total: l.parts.length, checked: checked.length };
  };

  // On-demand audio scan for the levels currently shown (concurrency-limited).
  const scanAudio = async () => {
    setScanning(true);
    const jobs = shown.flatMap((l) => l.parts.map((p) => p));
    let i = 0;
    const worker = async () => {
      while (i < jobs.length) {
        const p = jobs[i++];
        try { const r = await audioStatus(p.audioKey, p.audioScript); setAudio((m) => ({ ...m, [p.audioKey]: r.cached })); }
        catch { /* ignore */ }
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    setScanning(false);
  };

  // Bulk-generate audio for every part of the currently shown levels.
  const bulkGenAudio = async () => {
    const jobs = shown.flatMap((l) => l.parts);
    if (!confirm(
      `Tạo audio cho ${jobs.length} phần của ${shown.length} level đang hiện?\n` +
      `Lưu ý: tốn quota TTS (English = ElevenLabs, tiếng Trung = Qwen). Nên lọc hành tinh trước cho đỡ tốn.`,
    )) return;
    setBulk({ done: 0, total: jobs.length });
    let i = 0; let done = 0;
    const worker = async () => {
      while (i < jobs.length) {
        const p = jobs[i++];
        try { await generateAudio(p.audioKey, p.audioScript, true); setAudioCached(p.audioKey, true); } catch { /* keep going */ }
        done++; setBulk({ done, total: jobs.length });
      }
    };
    await Promise.all(Array.from({ length: 2 }, worker)); // gentle on TTS
    setBulk(null);
  };

  const Stat = ({ done, total, checked }: { done: number; total: number; checked?: number }) => {
    if (checked !== undefined && checked === 0) return <span className="muted">—</span>;
    const ok = done === total;
    return <span className={ok ? 'ok' : 'warn'}>{ok ? '✅' : '⚠️'} {done}/{total}</span>;
  };

  return (
    <>
      <div className="page-head">
        <h1>Quản lý bài thi</h1>
        <p>Bảng tất cả level — bấm “Mở” để sửa ảnh, audio, nội dung từng phần.</p>
      </div>
      <div className="card">
        <div className="toolbar">
          <div className="tabs">
            <button className={`btn sm ${lang === 'en' ? 'primary' : ''}`} onClick={() => { setLang('en'); setPlanet(''); }}>English</button>
            <button className={`btn sm ${lang === 'zh' ? 'primary' : ''}`} onClick={() => { setLang('zh'); setPlanet(''); }}>中文 HSK</button>
          </div>
          <div className="search" style={{ width: 200 }}>
            <span className="ico">🔍</span>
            <input placeholder="Tìm level…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select value={planet} onChange={(e) => setPlanet(e.target.value)}>
            <option value="">Tất cả hành tinh</option>
            {PLANETS[lang].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <span className="spacer" />
          {bulk && <span className="muted">Tạo audio… {bulk.done}/{bulk.total}</span>}
          <button className="btn sm" disabled={scanning || !!bulk} onClick={scanAudio}>
            {scanning ? 'Đang kiểm tra…' : '⟳ Kiểm tra audio'}
          </button>
          <button className="btn sm primary" disabled={!!bulk} onClick={bulkGenAudio}>
            🎙️ Tạo audio hàng loạt
          </button>
        </div>

        <table>
          <thead>
            <tr><th>#</th><th>Tên level</th><th>Phần</th><th>Ảnh</th><th>Audio</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((l) => {
              const im = imgStat(l); const au = audStat(l);
              const isOpen = open === l.levelNumber;
              return (
                <Fragment key={l.levelNumber}>
                  <tr className={isOpen ? 'open-row' : ''}>
                    <td><b>{displayNum(l.levelNumber)}</b></td>
                    <td>{l.title}</td>
                    <td>{l.parts.length}</td>
                    <td>{im.total ? <Stat done={im.done} total={im.total} /> : <span className="muted">—</span>}</td>
                    <td><Stat done={au.done} total={au.total} checked={au.checked} /></td>
                    <td>
                      <button className={`btn sm ${isOpen ? '' : 'primary'}`} onClick={() => setOpen(isOpen ? null : l.levelNumber)}>
                        {isOpen ? 'Đóng ▴' : 'Mở ▾'}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="detail-row">
                      <td colSpan={6}>
                        <LevelDetail level={l} onAudioCached={setAudioCached} onView={setLargeImg} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
        {shown.length === 0 && <p className="muted">Không có level khớp.</p>}
      </div>

      {largeImg && (
        <div className="lightbox" onClick={() => setLargeImg(null)}>
          <img src={largeImg} alt="" />
          <button className="btn sm" style={{ position: 'absolute', top: 16, right: 16 }} onClick={() => setLargeImg(null)}>✕ Đóng</button>
        </div>
      )}
    </>
  );
}

function LevelDetail({ level, onAudioCached, onView }: {
  level: CatLevel; onAudioCached: (k: string, v: boolean) => void; onView: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [prog, setProg] = useState('');
  const genAll = async () => {
    if (!confirm(`Tạo audio cho cả ${level.parts.length} phần của "${level.title}"?`)) return;
    setBusy(true);
    for (let i = 0; i < level.parts.length; i++) {
      const p = level.parts[i];
      setProg(`Đang tạo ${i + 1}/${level.parts.length}: ${p.partId}…`);
      try { await generateAudio(p.audioKey, p.audioScript, true); onAudioCached(p.audioKey, true); } catch { /* skip */ }
    }
    setProg('✓ Đã tạo audio cả level'); setBusy(false);
  };
  return (
    <>
      <div className="row" style={{ marginBottom: 8 }}>
        <button className="btn sm primary" disabled={busy} onClick={genAll}>🎙️ Tạo audio cả level</button>
        {prog && <span className="muted">{prog}</span>}
      </div>
      {level.parts.map((p) => (
        <PartCard key={p.partId} levelNumber={level.levelNumber} part={p}
          onAudio={(cached) => onAudioCached(p.audioKey, cached)} onView={onView} />
      ))}
    </>
  );
}

function PartCard({ levelNumber, part, onAudio, onView }: {
  levelNumber: number; part: CatPart; onAudio?: (cached: boolean) => void; onView?: (url: string) => void;
}) {
  const [script, setScript] = useState(part.audioScript);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [imgBust, setImgBust] = useState(0);
  const [audioUrl, setAudioUrl] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [imgOk, setImgOk] = useState<boolean | null>(null); // null=loading, true/false=loaded/missing
  const levelId = levelIdOf(levelNumber);

  // Load the scene image WITH auth (object URL); reloads when bust changes.
  useEffect(() => {
    if (!part.sceneId) { setImgOk(false); return; }
    let revoke = '';
    setImgOk(null);
    fetchSceneImage(part.sceneId)
      .then((url) => { revoke = url; setImgUrl(url); setImgOk(true); })
      .catch(() => setImgOk(false));
    return () => { if (revoke) URL.revokeObjectURL(revoke); };
  }, [part.sceneId, imgBust]);

  const run = (label: string, fn: () => Promise<string>) => async () => {
    setBusy(true); setMsg(`${label}…`);
    try { setMsg(await fn()); }
    catch (e) { setMsg('✗ ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };

  const onGenAudio = run('Tạo audio', async () => {
    const r = await generateAudio(part.audioKey, script, true);
    onAudio?.(true);
    return `✓ audio (${r.provider}, ${(r.bytes / 1024).toFixed(0)}KB)`;
  });
  const onCheckAudio = run('Kiểm tra', async () => {
    const r = await audioStatus(part.audioKey, script);
    onAudio?.(r.cached);
    return r.cached ? `✓ đã có audio (${r.provider})` : '⚠️ chưa có audio cho script này';
  });
  const onListen = run('Tải audio', async () => {
    setAudioUrl(await fetchAudio(part.audioKey, script));
    return '▶ đang phát bên dưới';
  });
  const onGenScene = run('Sinh ảnh', async () => {
    if (!part.sceneId) return '';
    const r = await generateScene(part.sceneId);
    setImgOk(null); setImgBust(Date.now());
    return `✓ ảnh sinh xong (${(r.bytes / 1024).toFixed(0)}KB)`;
  });
  const onPrompt = run('Lấy prompt', async () => {
    if (!part.sceneId) return '';
    const r = await getScenePrompt(part.sceneId);
    await navigator.clipboard?.writeText(r.prompt).catch(() => {});
    return '✓ đã copy prompt';
  });
  const onUpload = (file: File) => run('Upload', async () => {
    if (!part.sceneId) return '';
    await uploadScene(part.sceneId, file);
    setImgOk(null); setImgBust(Date.now());
    return '✓ upload ảnh xong';
  })();
  const onSaveScript = run('Lưu script', async () => { await saveScript(levelId, part.partId, script); return '✓ đã lưu — bấm "Tạo audio" để áp dụng'; });
  const onResetScript = run('Khôi phục', async () => { await deleteScript(levelId, part.partId); setScript(part.audioScript); return '✓ đã về script gốc — tạo lại audio'; });

  return (
    <div className="part">
      <div className="row">
        <b>{part.partId}</b>
        <span className="tag">{partLabel(part.type)}</span>
        <span className="mono">{part.audioKey}</span>
      </div>
      <div className="part-body">
        {part.sceneId ? (
          <div className="scene">
            <div className="scene-frame" onClick={() => imgOk && onView?.(imgUrl)}>
              {imgOk && <img src={imgUrl} alt={part.sceneId} title="Bấm để xem ảnh to" />}
              {imgOk === null && <span className="ph">Đang tải ảnh…</span>}
              {imgOk === false && <span className="ph">Chưa có ảnh — bấm “Sinh ảnh” hoặc “Upload”.</span>}
            </div>
            <div className="mono">{part.sceneId}</div>
            <div className="row wrap">
              <button className="btn sm" disabled={busy} onClick={onGenScene}>Sinh ảnh</button>
              <button className="btn sm" disabled={busy} onClick={onPrompt}>Prompt</button>
              <label className="btn sm">Upload<input type="file" accept="image/*" hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} /></label>
            </div>
          </div>
        ) : <div className="scene muted" style={{ alignSelf: 'center' }}>(không có ảnh)</div>}

        <div className="audio">
          <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={8} />
          <div className="row wrap">
            <button className="btn sm primary" disabled={busy} onClick={onGenAudio}>🎙️ Tạo / Regen</button>
            <button className="btn sm" disabled={busy} onClick={onListen}>▶ Nghe</button>
            <button className="btn sm" disabled={busy} onClick={onCheckAudio}>Kiểm tra</button>
            <button className="btn sm" disabled={busy} onClick={onSaveScript}>Lưu script</button>
            <button className="btn sm" disabled={busy} onClick={onResetScript}>Khôi phục gốc</button>
          </div>
          {audioUrl && <audio controls autoPlay src={audioUrl} style={{ width: '100%', marginTop: 8 }} />}
        </div>
      </div>
      {msg && <div className="muted" style={{ marginTop: 6 }}>{msg}</div>}
    </div>
  );
}
