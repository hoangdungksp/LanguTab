import { useEffect, useState } from 'react';
import {
  fetchCheckoutInfo,
  openCheckout,
  BillingError,
  type CheckoutInfo,
  type PlanInfo,
} from '../../services/billingService';
import { refreshTier } from '../hooks/useTier';

interface Props {
  onClose: () => void;
  /** Currently displayed limit on Free, used in the comparison list */
  freeStoryLimit?: number;
  /** Pro daily limit — shown alongside the Free limit so users see the value */
  proStoryLimit?: number;
}

/**
 * Upgrade modal — pitches Pro features and launches the Lemon Squeezy
 * checkout for the chosen plan in a new tab.
 *
 * Three plan cards: Pro Monthly, Pro Yearly (highlighted as best value),
 * Lifetime (high-ticket but limited-time vibe). Each card hides itself if
 * the corresponding Lemon Squeezy variant isn't configured server-side, so
 * Jason can launch with Monthly+Yearly first and add Lifetime later.
 *
 * After the user clicks a plan we pop the LS checkout in a new tab. When
 * they come back to LinguTab, the focus listener inside useTier() refetches
 * tier — so the UI flips from Free → Pro automatically without a reload.
 */
export function UpgradeModal({
  onClose,
  freeStoryLimit = 3,
  proStoryLimit = 30,
}: Props) {
  const [info, setInfo] = useState<CheckoutInfo | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [launchingPlan, setLaunchingPlan] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchCheckoutInfo()
      .then((res) => { if (alive) setInfo(res); })
      .catch((err) => {
        if (alive) {
          setError(err instanceof BillingError ? err.message : 'Không tải được thông tin gói. Thử lại sau.');
          setInfo(null);
        }
      });
    return () => { alive = false; };
  }, []);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const launch = (plan: PlanInfo, key: string) => {
    setLaunchingPlan(key);
    openCheckout(plan.url);
    // Optimistic: assume the user will complete checkout in the new tab.
    // useTier() refreshes on window focus when they come back, so the badge
    // in the Header flips from Free → Pro without manual refresh.
    // Schedule a couple of explicit refreshes in case focus event misses.
    setTimeout(() => refreshTier(), 30_000);
    setTimeout(() => refreshTier(), 90_000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-700/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-chunk border-2 border-ink-700 bg-paper p-6 shadow-chunky-ink">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-ink-700">
              ✨ Nâng cấp lên LinguTab Pro
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              Mở khoá kho truyện AI lớn hơn 10× để học mỗi ngày
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-full p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
          >
            ✕
          </button>
        </div>

        {/* Feature comparison */}
        <div className="mb-6 grid gap-3 rounded-chunk border-2 border-ink-100 bg-cream p-4 sm:grid-cols-3">
          <FeatureRow
            label="Truyện AI / ngày"
            free={`${freeStoryLimit} truyện`}
            pro={`${proStoryLimit} truyện`}
          />
          <FeatureRow label="Đồng bộ cloud" free="✅" pro="✅" />
          <FeatureRow label="Ảnh flashcard custom" free="✅" pro="✅" />
        </div>

        {/* Plans */}
        {info === undefined ? (
          <div className="py-8 text-center text-sm text-ink-500">Đang tải gói...</div>
        ) : info === null ? (
          <div className="rounded-chunk border-2 border-amber-300 bg-amber-50 p-4 text-center text-sm text-amber-800">
            <p className="font-semibold">⚠️ Tính năng thanh toán đang được setup</p>
            <p className="mt-1 text-xs">
              Quay lại sau ít ngày nữa! Nếu bạn rất muốn dùng Pro ngay,
              gửi mail cho mình ở jasonnguyenksp@gmail.com.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {info.plans.pro_monthly && (
              <PlanCard
                title="Pro hàng tháng"
                price={info.plans.pro_monthly.price_usd}
                pricePeriod="/tháng"
                description="Linh hoạt, huỷ bất kỳ lúc nào"
                cta="Đăng ký hàng tháng"
                onClick={() => launch(info.plans.pro_monthly!, 'monthly')}
                loading={launchingPlan === 'monthly'}
              />
            )}
            {info.plans.pro_yearly && (
              <PlanCard
                title="Pro hàng năm"
                price={info.plans.pro_yearly.price_usd}
                pricePeriod="/năm"
                description="Tiết kiệm ~33% so với gói tháng"
                cta="Đăng ký hàng năm"
                highlight
                onClick={() => launch(info.plans.pro_yearly!, 'yearly')}
                loading={launchingPlan === 'yearly'}
              />
            )}
            {info.plans.lifetime && (
              <PlanCard
                title="Trọn đời"
                price={info.plans.lifetime.price_usd}
                pricePeriod="một lần"
                description="Trả 1 lần, dùng mãi mãi"
                cta="Mua trọn đời"
                onClick={() => launch(info.plans.lifetime!, 'lifetime')}
                loading={launchingPlan === 'lifetime'}
              />
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-chunk border-2 border-coral-300 bg-coral-50 p-3 text-sm text-coral-700">
            ⚠️ {error}
          </div>
        )}

        {/* Footnote */}
        <p className="mt-6 text-center text-xs text-ink-400">
          Thanh toán an toàn qua Lemon Squeezy. Hoàn tiền trong 14 ngày nếu không hài lòng.
        </p>
      </div>
    </div>
  );
}

// ─── Helper components ─────────────────────────────────────────────────────

function FeatureRow({ label, free, pro }: { label: string; free: string; pro: string }) {
  return (
    <div className="text-center">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </div>
      <div className="mt-1 flex items-center justify-center gap-3 text-sm">
        <span className="text-ink-400 line-through opacity-70">{free}</span>
        <span className="font-bold text-coral-600">{pro}</span>
      </div>
    </div>
  );
}

interface PlanCardProps {
  title: string;
  price: string | null;
  pricePeriod: string;
  description: string;
  cta: string;
  highlight?: boolean;
  loading?: boolean;
  onClick: () => void;
}

function PlanCard({
  title,
  price,
  pricePeriod,
  description,
  cta,
  highlight,
  loading,
  onClick,
}: PlanCardProps) {
  return (
    <div
      className={[
        'flex flex-col rounded-chunk border-2 p-4 transition-all',
        highlight
          ? 'border-coral-500 bg-coral-50 shadow-chunky-coral'
          : 'border-ink-200 bg-paper',
      ].join(' ')}
    >
      {highlight && (
        <div className="mb-2 inline-block rounded-pill bg-coral-500 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
          Tiết kiệm nhất
        </div>
      )}
      <h3 className="font-display text-lg font-bold text-ink-700">{title}</h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="font-display text-3xl font-bold text-ink-700">
          {price ? `$${price}` : '—'}
        </span>
        <span className="text-sm text-ink-500">{pricePeriod}</span>
      </div>
      <p className="mt-1 text-xs text-ink-500">{description}</p>
      <button
        onClick={onClick}
        disabled={loading}
        className={[
          'mt-4 rounded-pill border-2 px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50',
          highlight
            ? 'border-coral-700 bg-coral-500 text-white hover:bg-coral-600'
            : 'border-ink-700 bg-ink-700 text-cream hover:bg-ink-600',
        ].join(' ')}
      >
        {loading ? '⏳ Đang mở...' : cta}
      </button>
    </div>
  );
}
