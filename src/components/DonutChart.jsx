import "./DonutChart.css";

const PALETTE = [
  "#4f46e5",
  "#06b6d4",
  "#f59e0b",
  "#ef4444",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#6366f1",
];

const DonutChart = ({ data = [], size = 184, thickness = 30 }) => {
  const colored = data.map((entry, index) => ({
    ...entry,
    color: PALETTE[index % PALETTE.length],
  }));

  const segments = colored.filter((entry) => entry.count > 0);
  const total = segments.reduce((sum, entry) => sum + entry.count, 0);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-chart">
      {total === 0 ? (
        <div className="donut-empty" style={{ width: size, height: size }}>
          Sin datos
        </div>
      ) : (
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="img"
          aria-label="Gráfico circular de resultados"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eef0f5"
            strokeWidth={thickness}
          />
          <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
            {segments.map((segment) => {
              const fraction = segment.count / total;
              const dash = fraction * circumference;
              const node = (
                <circle
                  key={segment.option}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={-offset}
                />
              );
              offset += dash;
              return node;
            })}
          </g>
        </svg>
      )}

      <ul className="donut-legend">
        {colored.map((entry) => (
          <li key={entry.option} className="donut-legend-item">
            <span
              className="donut-legend-swatch"
              style={{ backgroundColor: entry.color }}
            />
            <span className="donut-legend-label">{entry.option}</span>
            <span className="donut-legend-value">
              {entry.count} · {entry.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DonutChart;
