'use client'

interface DataPoint {
  label: string
  value: number
}

interface ActivityChartProps {
  data: DataPoint[]
  color?: string
  height?: number
}

export function ActivityChart({ data, color = '#CCFF00', height = 80 }: ActivityChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className="w-full">
      {/* Bars */}
      <div
        className="flex items-end gap-1 w-full"
        style={{ height: `${height}px` }}
      >
        {data.map((point, i) => {
          const pct = (point.value / max) * 100
          return (
            <div
              key={i}
              className="flex-1 group relative flex flex-col justify-end"
              style={{ height: '100%' }}
            >
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                <div className="bg-surface border border-surface-border rounded-md px-2 py-1 text-[11px] font-mono font-bold whitespace-nowrap shadow-xl">
                  <span style={{ color }}>{point.value}</span>
                </div>
                <div className="w-0 h-0 border-l-4 border-r-4 border-l-transparent border-r-transparent border-t-4 border-t-surface-border mx-auto" />
              </div>

              {/* Bar */}
              <div
                className="rounded-t-sm transition-all duration-300 group-hover:opacity-100 opacity-70"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: pct > 0
                    ? `linear-gradient(180deg, ${color} 0%, ${color}60 100%)`
                    : '#262626',
                  boxShadow: pct > 0 ? `0 0 8px ${color}30` : 'none',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-1 mt-2">
        {data.map((point, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] text-text-muted font-mono truncate block">{point.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
