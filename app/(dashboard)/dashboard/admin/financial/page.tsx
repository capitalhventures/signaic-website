import { Card, CardTitle, Badge } from "@/components/ui";
import {
  DollarSign,
  TrendingUp,
  Calculator,
  Wallet,
  BarChart3,
} from "lucide-react";

// MRR projection data
const mrrData = [
  { month: "Mar 2026", users: 0, mrr: 0, churn: "0%", net: "$0" },
  { month: "Apr 2026", users: 1, mrr: 500, churn: "0%", net: "$500" },
  { month: "May 2026", users: 2, mrr: 1000, churn: "0%", net: "$1,000" },
  { month: "Jun 2026", users: 3, mrr: 1500, churn: "0%", net: "$1,500" },
  { month: "Jul 2026", users: 5, mrr: 2500, churn: "0%", net: "$2,500" },
  { month: "Aug 2026", users: 7, mrr: 3500, churn: "5%", net: "$3,325" },
  { month: "Sep 2026", users: 10, mrr: 5000, churn: "5%", net: "$4,750" },
  { month: "Oct 2026", users: 10, mrr: 5000, churn: "5%", net: "$4,750" },
  { month: "Nov 2026", users: 10, mrr: 5000, churn: "5%", net: "$4,750" },
  { month: "Dec 2026", users: 10, mrr: 5000, churn: "5%", net: "$4,750" },
];

// Operating costs
const costs = [
  { service: "Vercel (Pro)", low: 20, high: 20, notes: "Fixed plan" },
  { service: "Supabase (Pro)", low: 25, high: 25, notes: "Fixed plan" },
  { service: "n8n Cloud Pro", low: 24, high: 24, notes: "Fixed plan" },
  { service: "Anthropic API (Claude)", low: 50, high: 200, notes: "Usage-based, scales with users" },
  { service: "OpenAI API", low: 10, high: 50, notes: "Embeddings, fallback" },
  { service: "Resend (Email)", low: 0, high: 20, notes: "Free tier → Pro" },
  { service: "Domain / DNS", low: 2, high: 2, notes: "Annual amortized" },
  { service: "Claude Max (ATLAS)", low: 100, high: 200, notes: "Engineering agent" },
  { service: "GitHub (Team)", low: 4, high: 4, notes: "Repo hosting" },
  { service: "Monitoring / Misc", low: 10, high: 25, notes: "Error tracking, uptime" },
];

const totalLow = costs.reduce((sum, c) => sum + c.low, 0);
const totalHigh = costs.reduce((sum, c) => sum + c.high, 0);

// Unit economics targets
const unitEcon = [
  { metric: "Orbital Brief Price", value: "$500/mo", notes: "Per-seat monthly subscription" },
  { metric: "Customer Acquisition Cost (CAC)", value: "$250", notes: "Target blended CAC" },
  { metric: "Lifetime Value (LTV)", value: "$9,000", notes: "18 months avg lifetime × $500" },
  { metric: "LTV:CAC Ratio", value: "36:1", notes: "Target >3:1 for healthy SaaS" },
  { metric: "Payback Period", value: "< 1 month", notes: "$500 MRR vs $250 CAC" },
  { metric: "Gross Margin", value: "~85%", notes: "API costs ~$15/user/mo at scale" },
  { metric: "Break-even Users", value: "1", notes: "$500 MRR > $280 min costs" },
  { metric: "Seed Raise Target", value: "10 customers", notes: "$5K MRR proves PMF" },
];

export default function FinancialPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-brand-cyan" />
          LEDGER — Financial Overview
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Revenue projections, cost model, and unit economics for Signaic.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current MRR
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">$0</p>
          <p className="text-xs text-slate-400 mt-1">Pre-revenue</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Burn
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">
            ${totalLow}
            <span className="text-lg text-slate-400">–${totalHigh}</span>
          </p>
          <p className="text-xs text-slate-400 mt-1">Operating costs</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Target Price
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">$500</p>
          <p className="text-xs text-slate-400 mt-1">/mo per Orbital Brief seat</p>
        </Card>
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <Calculator className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Break-even
            </span>
          </div>
          <p className="text-3xl font-bold text-slate-900">1</p>
          <p className="text-xs text-slate-400 mt-1">customer covers min costs</p>
        </Card>
      </div>

      {/* MRR Tracker */}
      <Card>
        <CardTitle className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-brand-cyan" />
          MRR Projection
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                  Month
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                  Active Users
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                  Gross MRR
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                  Churn Rate
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                  Net Revenue
                </th>
              </tr>
            </thead>
            <tbody>
              {mrrData.map((row, i) => (
                <tr
                  key={row.month}
                  className={`border-b border-slate-50 hover:bg-slate-50 ${
                    i === 0 ? "bg-brand-cyan/5 font-medium" : ""
                  }`}
                >
                  <td className="py-2.5 px-2 text-slate-700 font-medium">
                    {row.month}
                    {i === 0 && (
                      <Badge variant="cyan" className="ml-2 text-[10px]">
                        Current
                      </Badge>
                    )}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                    {row.users}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                    ${row.mrr.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-500">
                    {row.churn}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-900 font-semibold font-mono">
                    {row.net}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardTitle className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-brand-cyan" />
          Monthly Operating Costs
        </CardTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-2 text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                  Service
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                  Low
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                  High
                </th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-brand-cyan uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {costs.map((cost) => (
                <tr
                  key={cost.service}
                  className="border-b border-slate-50 hover:bg-slate-50"
                >
                  <td className="py-2.5 px-2 text-slate-700 font-medium">
                    {cost.service}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                    ${cost.low}
                  </td>
                  <td className="py-2.5 px-2 text-right text-slate-600 font-mono">
                    ${cost.high}
                  </td>
                  <td className="py-2.5 px-2 text-slate-400 text-xs">
                    {cost.notes}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold">
                <td className="py-3 px-2 text-slate-900">Total</td>
                <td className="py-3 px-2 text-right text-slate-900 font-mono">
                  ${totalLow}
                </td>
                <td className="py-3 px-2 text-right text-slate-900 font-mono">
                  ${totalHigh}
                </td>
                <td className="py-3 px-2 text-slate-400 text-xs">
                  Monthly operating range
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Unit Economics + Runway Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Unit Economics */}
        <Card>
          <CardTitle className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-brand-cyan" />
            Unit Economics
          </CardTitle>
          <div className="space-y-0">
            {unitEcon.map((item) => (
              <div
                key={item.metric}
                className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0"
              >
                <div>
                  <p className="text-sm text-slate-700 font-medium">
                    {item.metric}
                  </p>
                  <p className="text-xs text-slate-400">{item.notes}</p>
                </div>
                <span className="text-sm font-semibold text-slate-900 font-mono whitespace-nowrap ml-4">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Runway Calculator */}
        <Card>
          <CardTitle className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-brand-cyan" />
            Runway Calculator
          </CardTitle>
          <RunwayCalculator totalLow={totalLow} totalHigh={totalHigh} />
        </Card>
      </div>
    </div>
  );
}

function RunwayCalculator({
  totalLow,
  totalHigh,
}: {
  totalLow: number;
  totalHigh: number;
}) {
  // Static calculation — no interactivity needed for server component
  const cashOnHand = 5000;
  const monthlyBurnLow = totalLow;
  const monthlyBurnHigh = totalHigh;
  const runwayLow = Math.floor(cashOnHand / monthlyBurnHigh);
  const runwayHigh = Math.floor(cashOnHand / monthlyBurnLow);

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
              Cash on Hand
            </p>
            <p className="text-2xl font-bold text-slate-900 font-mono">
              ${cashOnHand.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">
              Monthly Burn
            </p>
            <p className="text-2xl font-bold text-slate-900 font-mono">
              ${monthlyBurnLow}–${monthlyBurnHigh}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-brand-cyan/5 border border-brand-cyan/20 rounded-lg p-4 text-center">
        <p className="text-xs text-brand-cyan uppercase tracking-wider font-semibold mb-1">
          Estimated Runway
        </p>
        <p className="text-3xl font-bold text-slate-900 font-mono">
          {runwayLow}–{runwayHigh}
          <span className="text-lg text-slate-400 ml-1">months</span>
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-500">At minimum burn (${monthlyBurnLow}/mo)</span>
          <span className="text-slate-700 font-medium font-mono">
            {runwayHigh} months
          </span>
        </div>
        <div className="flex justify-between py-1.5 border-b border-slate-50">
          <span className="text-slate-500">At maximum burn (${monthlyBurnHigh}/mo)</span>
          <span className="text-slate-700 font-medium font-mono">
            {runwayLow} months
          </span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-slate-500">With 1 customer ($500 MRR)</span>
          <span className="text-emerald-600 font-semibold font-mono">
            Cash-flow positive
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-400 italic">
        Note: This is a simplified model. Actual runway depends on revenue timing,
        one-time costs, and API usage scaling with customer count.
      </p>
    </div>
  );
}
