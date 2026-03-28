"use client";

export function CommandCenterPreview() {
  const stats = [
    { label: "Total Tracked Entities", value: "36" },
    { label: "New Filings", value: "12" },
    { label: "Active Alerts", value: "64" },
    { label: "Contract Value", value: "$123.1B" },
  ];

  const activities = [
    { time: "2m ago", text: "SpaceX filed FCC modification for Starlink Gen2", color: "#00D4FF" },
    { time: "18m ago", text: "L3Harris awarded $142M Space Force contract", color: "#6366F1" },
    { time: "1h ago", text: "Leo patent granted: phased array antenna design", color: "#00D4FF" },
    { time: "3h ago", text: "Northrop Grumman 10-Q filed with SEC EDGAR", color: "#6366F1" },
  ];

  const chartData = [32, 45, 28, 52, 38, 61, 44, 55, 48, 67, 42, 58];
  const chartMax = Math.max(...chartData);

  return (
    <div className="rounded-xl border border-[#1a1a2e] overflow-hidden mb-16">
      <div
        className="p-6 sm:p-8"
        style={{
          background: "#0A0A1A",
          transform: "scale(0.85)",
          transformOrigin: "top center",
        }}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-[11px] text-gray-600 font-mono">
            signaic.com/cmd
          </span>
          <div className="w-16" />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-lg p-3"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #1a1a2e",
              }}
            >
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                {stat.label}
              </p>
              <p className="text-lg sm:text-xl font-bold text-white font-[family-name:var(--font-chakra-petch)]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Recent activity */}
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #1a1a2e",
            }}
          >
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">
              Recent Activity
            </p>
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{ background: a.color }}
                  />
                  <div>
                    <p className="text-[12px] text-gray-300 leading-tight">
                      {a.text}
                    </p>
                    <p className="text-[10px] text-gray-600 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div
            className="rounded-lg p-4"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #1a1a2e",
            }}
          >
            <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">
              Filing Activity (12 Weeks)
            </p>
            <div className="flex items-end gap-1.5 h-28">
              {chartData.map((val, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm"
                  style={{
                    height: `${(val / chartMax) * 100}%`,
                    background:
                      i % 2 === 0
                        ? "rgba(0, 212, 255, 0.5)"
                        : "rgba(99, 102, 241, 0.5)",
                  }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[9px] text-gray-600">12w ago</span>
              <span className="text-[9px] text-gray-600">This week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
