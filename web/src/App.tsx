import { useEffect, useMemo, useState } from 'react';
import { signIn, getToken, clearToken, setOnAuthExpired } from './auth';
import { ExamManage } from './ExamManage';
import {
  getMe, getStats, listUsers, setUserRole, getUserProgress,
  type Me, type Stats, type AdminUser, type ProgressRow,
} from './api';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

export function App() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOnAuthExpired(() => { setMe(null); setError('Phiên đăng nhập hết hạn — đăng nhập lại.'); });
    if (getToken()) getMe().then(setMe).catch(() => clearToken());
  }, []);

  const login = async () => {
    setError(''); setLoading(true);
    try { await signIn(); setMe(await getMe()); }
    catch (e) { setError(e instanceof Error ? e.message : String(e)); }
    finally { setLoading(false); }
  };
  const logout = () => { clearToken(); setMe(null); };

  if (!me) {
    return (
      <div className="center">
        <div className="login">
          <img className="logo-img" src="/logo.png" alt="LinguTab" />
          <h1>LinguTab</h1>
          <p>Bảng điều khiển quản lý</p>
          <button className="btn primary" onClick={login} disabled={loading}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập với Google'}
          </button>
          {error && <p className="error" style={{ marginTop: 14 }}>{error}</p>}
        </div>
      </div>
    );
  }

  if (me.role === 'user') {
    return (
      <div className="center">
        <div className="login">
          <div className="logo">🔒</div>
          <h1>Chưa có quyền</h1>
          <p>{me.email} — vai trò <b>{me.role}</b>.<br />Liên hệ admin để được cấp quyền editor/admin.</p>
          <button className="btn" onClick={logout}>Đăng xuất</button>
        </div>
      </div>
    );
  }

  return <Shell me={me} onLogout={logout} />;
}

type View = 'overview' | 'users' | 'exam';

function Shell({ me, onLogout }: { me: Me; onLogout: () => void }) {
  const isAdmin = me.role === 'admin';
  const [view, setView] = useState<View>(isAdmin ? 'overview' : 'exam');

  const NavItem = ({ id, ico, label }: { id: View; ico: string; label: string }) => (
    <button className={`nav-item ${view === id ? 'active' : ''}`} onClick={() => setView(id)}>
      <span className="ico">{ico}</span><span>{label}</span>
    </button>
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand"><img src="/logo.png" alt="" /><span>LinguTab</span></div>
        <nav className="nav">
          {isAdmin && <NavItem id="overview" ico="📊" label="Tổng quan" />}
          {isAdmin && <NavItem id="users" ico="👥" label="Người dùng" />}
          <NavItem id="exam" ico="📝" label="Bài thi" />
        </nav>
        <div className="sidebar-foot">
          <div className="avatar">{me.email[0]?.toUpperCase()}</div>
          <div className="who"><b>{me.email}</b><span>{me.role}</span></div>
          <button className="btn ghost sm" title="Đăng xuất" onClick={onLogout}>⎋</button>
        </div>
      </aside>

      <main className="main">
        {view === 'exam' && <ExamManage />}
        {view === 'users' && <UsersPanel showStats={false} />}
        {view === 'overview' && <UsersPanel showStats overviewOnly />}
      </main>
    </div>
  );
}

function UsersPanel({ showStats = true, overviewOnly = false }: { showStats?: boolean; overviewOnly?: boolean }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? users.filter((u) => (u.email + (u.display_name || '')).toLowerCase().includes(s)) : users;
  }, [users, q]);

  useEffect(() => {
    Promise.all([getStats(), listUsers()])
      .then(([s, u]) => { setStats(s); setUsers(u); })
      .catch((e) => setErr(e.message));
  }, []);

  const changeRole = async (u: AdminUser, role: string) => {
    try {
      await setUserRole(u.id, role);
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role } : x)));
    } catch (e) { setErr(e instanceof Error ? e.message : String(e)); }
  };

  return (
    <>
      <div className="page-head">
        <h1>{overviewOnly ? 'Tổng quan' : 'Người dùng'}</h1>
        <p>{overviewOnly ? 'Số liệu nhanh về người dùng và bài thi.' : 'Quản lý vai trò và xem tiến độ học.'}</p>
      </div>
      {err && <p className="error">{err}</p>}

      {showStats && stats && (
        <div className="stats">
          <Stat ico="👥" color="#eef2ff" label="Người dùng" value={stats.totalUsers} />
          <Stat ico="✅" color="#dcfce7" label="Level hoàn thành" value={stats.levelsCompleted} />
          <Stat ico="⭐" color="#fef9c3" label="Sao đạt được" value={stats.starsEarned} />
          <Stat ico="💎" color="#fff1e6" label="Tài khoản Pro" value={stats.byTier.find((t) => t.tier === 'pro')?.n ?? 0} />
        </div>
      )}

      {!overviewOnly && (
        <div className="card">
          <div className="row" style={{ marginBottom: 14 }}>
            <h2 style={{ margin: 0 }}>Tất cả người dùng ({shown.length})</h2>
            <span className="spacer" />
            <div className="search" style={{ width: 240 }}>
              <span className="ico">🔍</span>
              <input placeholder="Tìm email hoặc tên…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <table>
            <thead>
              <tr><th>Người dùng</th><th>Vai trò</th><th>Gói</th><th>Hoạt động</th><th></th></tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{u.display_name || u.email.split('@')[0]}</div>
                    <div className="mono">{u.email}</div>
                  </td>
                  <td>
                    <select value={u.role || 'user'} onChange={(e) => changeRole(u, e.target.value)}>
                      <option value="user">user</option>
                      <option value="editor">editor</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                  <td><span className={`badge ${u.tier === 'pro' ? 'pro' : 'free'}`}>{u.tier || 'free'}</span></td>
                  <td className="muted">{timeAgo(u.last_active_at)}</td>
                  <td><button className="btn sm" onClick={() => setSelected(u)}>Tiến độ →</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {overviewOnly && stats && <Charts stats={stats} />}

      {selected && <ProgressDrawer user={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function Stat({ ico, color, label, value }: { ico: string; color: string; label: string; value: number }) {
  return (
    <div className="stat">
      <div className="chip" style={{ background: color }}>{ico}</div>
      <div><div className="num">{value}</div><div className="lbl">{label}</div></div>
    </div>
  );
}

const PLANET_ORDER = ['Starters', 'Movers', 'Flyers', 'HSK1', 'HSK2', 'HSK3'];
const PIE_COLORS = ['#f97316', '#6366f1', '#16a34a', '#f59e0b', '#0ea5e9'];

function Charts({ stats }: { stats: Stats }) {
  const planetData = PLANET_ORDER.map((p) => {
    const r = stats.byPlanet.find((x) => x.planet === p);
    return { planet: p, levels: r?.n ?? 0, stars: r?.stars ?? 0 };
  });
  const roleData = stats.byRole.map((r) => ({ name: r.role || 'user', value: r.n }));
  return (
    <div className="chart-grid">
      <div className="card">
        <h2>Hoàn thành theo hành tinh</h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={planetData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" vertical={false} />
            <XAxis dataKey="planet" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="levels" name="Level hoàn thành" fill="#f97316" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="card">
        <h2>Người dùng theo vai trò</h2>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={92} paddingAngle={2}>
              {roleData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Legend /><Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ProgressDrawer({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const [rows, setRows] = useState<ProgressRow[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { getUserProgress(user.id).then(setRows).catch((e) => setErr(e.message)); }, [user.id]);

  const planet = (n: number) =>
    n > 140 ? 'HSK3' : n > 120 ? 'HSK2' : n > 100 ? 'HSK1' : n > 40 ? 'Flyers' : n > 20 ? 'Movers' : 'Starters';
  const display = (n: number) => (n > 100 ? n - 100 : n);

  return (
    <div className="drawer-bg" onClick={onClose}>
      <div className="drawer" onClick={(e) => e.stopPropagation()}>
        <header>
          <div><b>Tiến độ học</b><div className="mono">{user.email}</div></div>
          <button className="btn sm" onClick={onClose}>✕</button>
        </header>
        {err && <p className="error">{err}</p>}
        {!rows ? <p className="muted">Đang tải…</p>
          : rows.length === 0 ? <p className="muted">Chưa làm bài thi nào.</p>
          : (
            <table>
              <thead><tr><th>Hành tinh</th><th>Level</th><th>Sao</th><th>Lần thi</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.level_number}>
                    <td><span className="tag">{planet(r.level_number)}</span></td>
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
  const h = Math.floor((Date.now() - ms) / 3600000);
  if (h < 1) return 'vừa xong';
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}
