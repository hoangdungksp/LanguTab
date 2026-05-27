import { useMemo, useState } from 'react';
import { levelsFor, levelIdOf, partLabel, type CatLevel, type CatPart } from './catalog';
import {
  sceneImageUrl, generateScene, getScenePrompt, uploadScene,
  audioStatus, generateAudio, saveScript, deleteScript,
} from './examApi';

/** Editor/admin section: manage exam levels (images, audio, scripts). */
export function ExamManage() {
  const [lang, setLang] = useState<'en' | 'zh'>('en');
  const levels = useMemo(() => levelsFor(lang), [lang]);
  const [levelNumber, setLevelNumber] = useState<number>(levels[0]?.levelNumber ?? 1);
  const level: CatLevel | undefined = levels.find((l) => l.levelNumber === levelNumber) ?? levels[0];

  return (
    <section className="card">
      <div className="row">
        <h2>Quản lý bài thi</h2>
        <span className="spacer" />
        <div className="tabs">
          <button className={`btn sm ${lang === 'en' ? 'primary' : ''}`} onClick={() => { setLang('en'); setLevelNumber(1); }}>English</button>
          <button className={`btn sm ${lang === 'zh' ? 'primary' : ''}`} onClick={() => { setLang('zh'); setLevelNumber(101); }}>中文 HSK</button>
        </div>
        <select value={level?.levelNumber} onChange={(e) => setLevelNumber(Number(e.target.value))}>
          {levels.map((l) => (
            <option key={l.levelNumber} value={l.levelNumber}>{l.title}</option>
          ))}
        </select>
      </div>

      {level && level.parts.map((p) => (
        <PartCard key={p.partId} levelNumber={level.levelNumber} part={p} />
      ))}
    </section>
  );
}

function PartCard({ levelNumber, part }: { levelNumber: number; part: CatPart }) {
  const [script, setScript] = useState(part.audioScript);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [imgBust, setImgBust] = useState(0);
  const levelId = levelIdOf(levelNumber);

  const run = (label: string, fn: () => Promise<string>) => async () => {
    setBusy(true); setMsg(`${label}…`);
    try { setMsg(await fn()); }
    catch (e) { setMsg('✗ ' + (e instanceof Error ? e.message : String(e))); }
    finally { setBusy(false); }
  };

  const onGenAudio = run('Tạo audio', async () => {
    const r = await generateAudio(part.audioKey, script, true);
    return `✓ audio (${r.provider}, ${(r.bytes / 1024).toFixed(0)}KB)`;
  });
  const onCheckAudio = run('Kiểm tra', async () => {
    const r = await audioStatus(part.audioKey, script);
    return r.cached ? `✓ đã có audio (${r.provider})` : '⚠️ chưa có audio cho script này';
  });
  const onGenScene = run('Sinh ảnh', async () => {
    if (!part.sceneId) return '';
    const r = await generateScene(part.sceneId);
    setImgBust(Date.now());
    return `✓ ảnh sinh xong (${(r.bytes / 1024).toFixed(0)}KB)`;
  });
  const onPrompt = run('Lấy prompt', async () => {
    if (!part.sceneId) return '';
    const r = await getScenePrompt(part.sceneId);
    await navigator.clipboard?.writeText(r.prompt).catch(() => {});
    return '✓ đã copy prompt vào clipboard';
  });
  const onUpload = (file: File) => run('Upload', async () => {
    if (!part.sceneId) return '';
    await uploadScene(part.sceneId, file);
    setImgBust(Date.now());
    return '✓ upload ảnh xong';
  })();
  const onSaveScript = run('Lưu script', async () => {
    await saveScript(levelId, part.partId, script);
    return '✓ đã lưu override — nhớ "Tạo audio" để áp dụng';
  });
  const onResetScript = run('Khôi phục', async () => {
    await deleteScript(levelId, part.partId);
    setScript(part.audioScript);
    return '✓ đã xoá override (về script gốc) — tạo lại audio';
  });

  return (
    <div className="part">
      <div className="row">
        <b>{part.partId}</b>
        <span className="tag">{partLabel(part.type)}</span>
        <span className="muted mono">{part.audioKey}</span>
      </div>

      <div className="part-body">
        {part.sceneId && (
          <div className="scene">
            <img
              src={`${sceneImageUrl(part.sceneId)}${imgBust ? `?t=${imgBust}` : ''}`}
              alt={part.sceneId}
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.15'; }}
            />
            <div className="muted mono">{part.sceneId}</div>
            <div className="row wrap">
              <button className="btn sm" disabled={busy} onClick={onGenScene}>Sinh ảnh</button>
              <button className="btn sm" disabled={busy} onClick={onPrompt}>Lấy prompt</button>
              <label className="btn sm">Upload
                <input type="file" accept="image/*" hidden
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
              </label>
            </div>
          </div>
        )}

        <div className="audio">
          <textarea value={script} onChange={(e) => setScript(e.target.value)} rows={4} />
          <div className="row wrap">
            <button className="btn sm primary" disabled={busy} onClick={onGenAudio}>🎙️ Tạo / Regen audio</button>
            <button className="btn sm" disabled={busy} onClick={onCheckAudio}>Kiểm tra</button>
            <button className="btn sm" disabled={busy} onClick={onSaveScript}>Lưu script</button>
            <button className="btn sm" disabled={busy} onClick={onResetScript}>Khôi phục gốc</button>
          </div>
        </div>
      </div>
      {msg && <div className="muted">{msg}</div>}
    </div>
  );
}
