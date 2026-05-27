import { useEffect, useState } from 'react';
import { signIn, getToken, clearToken } from './auth';
import { ExamManage } from './ExamManage';
import {
  getMe, getStats, listUsers, setUserRole, getUserProgress,
  type Me, type Stats, type AdminUser, type ProgressRow,
} from './api';

export function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Restore session: if a token is present, fetch /exam/me.
  useEffect(() => {
    if (getToken()) {
      getMe().then(setMe).catch(() => clearToken());
    }
  }, []);

  const login = async () => {
    setError(''); setLoading(true);
    try {
      await signIn();
      setMe(await getMe());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { clearToken(); setMe(null); };

  if (!me) {
    return (
      <div className="center">
        <div className="card login">
          <h1>🐼 LinguTab</h1>
          <p>Bảng điều khiển quản lý</p>
          <button className="btn primary" onClick={login} disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập với Google'}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      </div>
    );
  }

  if (me.role === 'user') {
    return (
      <div className="center">
        <div className="card login">
          <h1>Không có quyền</h1>
          <p>{me.email} — vai trò: <b>{me.role}</b></p>
          <p>Bảng điều khiển dành cho <b>editor</b> (quản lý bài thi) và <b>admin</b> (thêm quản lý người dùng). Liên hệ admin để được cấp quyền.</p>
          <button className="btn" onClick={logout}>Đăng xuất</button>
        </div>
      </div>
    );
  }

  return <Dashboard me={me} onLogout={logout} />;
}

function Dashboard({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const isAdmin = me.role === 'admin';
  const [view, setView] = useState<'users' | 'exam'>(isAdmin ? 'users' : 'exam');

  return (
    <div className="app">
      <header className="topbar">
        <b>🐼 LinguTab</b>
        <nav className="tabs">
          {isAdmin && (
            <button className={`btn sm ${view === 'users' ? 'primary' : ''}`} onClick={() => setView('users')}>Người dùng</button>
          )}
          <button className={`btn sm ${view === 'exam' ? 'primary' : ''}`} onClick={() => setView('exam')}>Bài thi</button>
        </nav>
        <span className="spacer" />
        <span className="muted">{me.email} · {me.role}</span>
        <button className="btn" onClick={onLogout}>Đăng xuất</button>
      </header>

      {view === 'exam' ? <ExamManage /> : <UsersPanel />}
    </div>
  );
}

function UsersPanel() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const reload = () => {
    Promise.all([getStats(), listUsers()])
      .then(([s, u]) => { setStats(s); setUsers(u); })
      .catch((e) => setErr(e.message));
  };
  useEffect(reload, []);

  const changeRole = async (u: AdminUser, role: string) => {
    try {
      await setUserRole(u.id, role);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <>
      {err && <p className="error pad">{err}</p>}

      {stats && (
        <section className="stats">
          <Stat label="Người dùng" value={stats.totalUsers} />
          <Stat label="Level hoàn thành" value={stats.levelsCompleted} />
          <Stat label="Sao đạt được" value={stats.starsEarned} />
          <Stat label="Pro" value={stats.byTier.find((t) => t.tier === 'pro')?.n ?? 0} />
        </section>
      )}

      <section className="card">
        <h2>Người dùng ({users.length})</h2>
        <table>
          <thead>
            <tr><th>Email</th><th>Tên</th><th>Vai trò</th><th>Gói</th><th>Hoạt động</th><th></th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.display_name || '—'}</td>
                <td>
                  <select value={u.role || 'user'} onChange={(e) => changeRole(u, e.target.value)}>
                    <option value="user">user</option>
                    <option value="editor">editor</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td>{u.tier || 'free'}</td>
                <td className="muted">{timeAgo(u.last_active_at)}</td>
                <td><button className="btn sm" onClick={() => setSelected(u)}>Tiến độ</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {selected && <ProgressDrawer user={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="stat"><div className="num">{value}</div><div className="muted">{label}</div></div>;
}

function ProgressDrawer({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [rows, setRows] = useState<ProgressRow[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    getUserProgress(user.id).then(setRows).catch((e) => setErr(e.message));
  }, [user.id]);

  const planet = (n: number) =>
    n > 140 ? 'HSK3' : n > 120 ? 'HSK2' : n > 100 ? 'HSK1'
    : n > 40 ? 'Flyers' : n > 20 ? 'Movers' : 'Starters';
  const display = (n: number) => (n > 100 ? n - 100 : n);

  return (
    <div className="drawer-bg" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <header><b>Tiến độ — {user.email}</b><button className="btn sm" onClick={onClose}>✕</button></header>
        {err && <p className="error">{err}</p>}
        {!rows ? <p className="muted">Đang tải…</p>
          : rows.length === 0 ? <p className="muted">Chưa làm bài thi nào.</p>
          : (
            <table>
              <thead><tr><th>Hành tinh</th><th>Level</th><th>Sao</th><th>Lần thi</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.level_number}>
                    <td>{planet(r.level_number)}</td>
                    <td>{display(r.level_number)}</td>
                    <td>{'⭐'.repeat(r.best_stars)}<span className="muted"> {r.best_stars}/{r.max_stars}</span></td>
                    <td className="muted">{r.attempts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
    </div>
  );
}

function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  const h = Math.floor(d / 3600000);
  if (h < 1) return 'vừa xong';
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}
