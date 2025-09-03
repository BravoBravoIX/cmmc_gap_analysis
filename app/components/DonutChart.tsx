'use client';

interface DonutChartData {
  label: string;
  value: number;
  color: string;
  textColor: string;
}

interface DonutChartProps {
  data: DonutChartData[];
  size?: number;
  centerLabel?: string;
  centerValue?: string;
  className?: string;
}

export default function DonutChart({ 
  data, 
  size = 200, 
  centerLabel = "Total", 
  centerValue, 
  className = "" 
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;
  const strokeWidth = 30;

  // Calculate paths for each segment
  let currentAngle = -90; // Start at top
  const segments = data.map((item) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    
    currentAngle += angle;

    // Calculate path for SVG arc
    const startAngleRad = (startAngle * Math.PI) / 180;
    const endAngleRad = (endAngle * Math.PI) / 180;
    
    const startX = centerX + radius * Math.cos(startAngleRad);
    const startY = centerY + radius * Math.sin(startAngleRad);
    const endX = centerX + radius * Math.cos(endAngleRad);
    const endY = centerY + radius * Math.sin(endAngleRad);
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    
    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${startX} ${startY}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'Z'
    ].join(' ');

    return {
      ...item,
      percentage: Math.round(percentage),
      pathData,
      startAngle,
      endAngle
    };
  });

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          
          {/* Segments */}
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={centerX}
              cy={centerY}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${(segment.value / total) * (2 * Math.PI * radius)} ${2 * Math.PI * radius}`}
              strokeDashoffset={-((segments.slice(0, index).reduce((sum, s) => sum + s.value, 0) / total) * (2 * Math.PI * radius))}
              className="transition-all duration-300 hover:opacity-80"
            />
          ))}
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-800">
            {centerValue || total}
          </div>
          <div className="text-sm text-gray-600 text-center">
            {centerLabel}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-3 w-full max-w-xs">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: segment.color }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 truncate">
                {segment.label}
              </div>
              <div className="text-xs text-gray-500">
                {segment.value} ({segment.percentage}%)
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to generate chart data from assessment results
export function generateChartData(overview: any) {
  const data = [
    {
      label: "Implemented",
      value: overview.yesCount || 0,
      color: "#16a34a", // green-600
      textColor: "#166534" // green-700
    },
    {
      label: "Partial",
      value: overview.partialCount || 0,
      color: "#eab308", // yellow-500
      textColor: "#a16207" // yellow-700
    },
    {
      label: "Not Implemented",
      value: overview.noCount || 0,
      color: "#dc2626", // red-600
      textColor: "#991b1b" // red-700
    },
    {
      label: "Unsure/Verification",
      value: (overview.unsureCount || 0) + (overview.skippedCount || 0),
      color: "#6b7280", // gray-500
      textColor: "#374151" // gray-700
    }
  ].filter(item => item.value > 0); // Only show segments with data

  return data;
}