import { formatCurrency } from '../lib/format';
import type { DashboardStats } from '../lib/stats';

interface Props {
  stats: DashboardStats;
}

function StatCard({
  label,
  amount,
  icon,
  color,
  subtitle,
}: {
  label: string;
  amount: number;
  icon: string;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-2xl bg-surface-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold tabular-nums" style={{ color }}>
        {formatCurrency(amount)}
      </p>
      {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
    </div>
  );
}

export function Dashboard({ stats }: Props) {
  return (
    <div className="space-y-6 px-4 pb-28 pt-2">
      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">Overview</h2>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl bg-surface-card p-3 text-center">
            <p className="text-xs text-gray-400">In</p>
            <p className="text-lg font-bold text-accent-green tabular-nums">
              {formatCurrency(stats.totalIn)}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-card p-3 text-center">
            <p className="text-xs text-gray-400">Out</p>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(stats.totalOut)}</p>
          </div>
          <div className="rounded-2xl bg-surface-card p-3 text-center">
            <p className="text-xs text-gray-400">Net</p>
            <p
              className={`text-lg font-bold tabular-nums ${stats.net >= 0 ? 'text-accent-green' : 'text-accent-red'}`}
            >
              {formatCurrency(stats.net)}
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
          Where money went
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Investing"
            amount={stats.investing}
            icon="📈"
            color="#0a84ff"
            subtitle="Total added to brokerage"
          />
          <StatCard
            label="Necessities"
            amount={stats.necessity}
            icon="🏠"
            color="#ff9f0a"
            subtitle="Transport & essentials"
          />
          <StatCard
            label="Fun"
            amount={stats.fun}
            icon="🎉"
            color="#ff375f"
            subtitle="Dining, rides, entertainment"
          />
          <StatCard
            label="Sent to People"
            amount={stats.peerOut}
            icon="🤝"
            color="#bf5af2"
            subtitle="Zelle, Venmo out"
          />
          <StatCard
            label="Subscriptions"
            amount={stats.subscriptions}
            icon="🔄"
            color="#64d2ff"
          />
          <StatCard
            label="Income"
            amount={stats.income}
            icon="💰"
            color="#30d158"
            subtitle="Payroll & interest"
          />
        </div>
      </section>

      {stats.peerOutReasons.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
            Sent to people — reasons
          </h2>
          <div className="space-y-2">
            {stats.peerOutReasons.map((r, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-surface-card px-4 py-3"
              >
                <div>
                  <p className="font-medium">{r.reason}</p>
                  {r.person && <p className="text-sm text-gray-400">To {r.person}</p>}
                </div>
                <p className="font-semibold tabular-nums text-[#bf5af2]">
                  −{formatCurrency(r.amount)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-gray-500">
          All categories
        </h2>
        <div className="space-y-2">
          {stats.byCategory
            .filter((c) => c.category !== 'internal_transfer')
            .map((c) => (
              <div
                key={c.category}
                className="flex items-center justify-between rounded-xl bg-surface-card px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span>{c.icon}</span>
                  <div>
                    <p className="font-medium">{c.label}</p>
                    <p className="text-xs text-gray-500">{c.count} transactions</p>
                  </div>
                </div>
                <p className="font-semibold tabular-nums" style={{ color: c.color }}>
                  {formatCurrency(c.total)}
                </p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}
