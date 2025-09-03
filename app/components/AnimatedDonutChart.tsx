'use client';

import { useEffect, useState } from 'react';

interface AnimatedDonutChartProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export default function AnimatedDonutChart({ 
  size = 200, 
  strokeWidth = 24,
  className = "" 
}: AnimatedDonutChartProps) {
  const [animationStarted, setAnimationStarted] = useState(false);
  const [currentOffsets, setCurrentOffsets] = useState({
    implemented: 0,
    partial: 0,
    gaps: 0,
    unknown: 0
  });

  const radius = (size / 2) - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;

  // Data for the chart (percentages)
  const data = {
    implemented: 40,
    partial: 25,
    gaps: 25,
    unknown: 10
  };

  // Convert percentages to stroke-dasharray values
  const strokeValues = {
    implemented: (data.implemented / 100) * circumference,
    partial: (data.partial / 100) * circumference,
    gaps: (data.gaps / 100) * circumference,
    unknown: (data.unknown / 100) * circumference
  };

  // Calculate stroke-dashoffset values for positioning
  const offsets = {
    implemented: 0,
    partial: -strokeValues.implemented,
    gaps: -(strokeValues.implemented + strokeValues.partial),
    unknown: -(strokeValues.implemented + strokeValues.partial + strokeValues.gaps)
  };

  useEffect(() => {
    // Start animation after component mounts
    const timer = setTimeout(() => {
      setAnimationStarted(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (animationStarted) {
      // Animate each segment with staggered timing
      const animateSegment = (segmentKey: keyof typeof offsets, delay: number) => {
        setTimeout(() => {
          setCurrentOffsets(prev => ({
            ...prev,
            [segmentKey]: offsets[segmentKey]
          }));
        }, delay);
      };

      animateSegment('implemented', 200);
      animateSegment('partial', 600);
      animateSegment('gaps', 1000);
      animateSegment('unknown', 1400);
    }
  }, [animationStarted]);

  return (
    <div className={`flex justify-center ${className}`}>
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          
          {/* Implemented segment (40%) - Green */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#16a34a"
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeValues.implemented} ${circumference}`}
            strokeDashoffset={currentOffsets.implemented}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
          
          {/* Partial segment (25%) - Yellow */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#eab308"
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeValues.partial} ${circumference}`}
            strokeDashoffset={currentOffsets.partial}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
          
          {/* Gaps segment (25%) - Red */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#dc2626"
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeValues.gaps} ${circumference}`}
            strokeDashoffset={currentOffsets.gaps}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
          
          {/* Unknown segment (10%) - Gray */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#6b7280"
            strokeWidth={strokeWidth}
            strokeDasharray={`${strokeValues.unknown} ${circumference}`}
            strokeDashoffset={currentOffsets.unknown}
            className="transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        
        {/* Center label with animation */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={`text-2xl font-bold text-gray-800 transition-all duration-1000 ${
            animationStarted ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}>
            130
          </div>
          <div className={`text-sm text-gray-600 transition-all duration-1000 delay-300 ${
            animationStarted ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}>
            Controls
          </div>
        </div>
      </div>
    </div>
  );
}