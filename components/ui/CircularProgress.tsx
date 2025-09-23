import React from 'react';

interface CircularProgressProps {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    trackColor?: string;
    textColor?: string;
}

const CircularProgress: React.FC<CircularProgressProps> = ({ 
    percentage, 
    size = 120, 
    strokeWidth = 10,
    color = 'text-blue-600',
    trackColor = 'text-gray-200',
    textColor = 'text-gray-700'
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const textSizeClass = size < 120 ? 'text-xl' : 'text-2xl';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    className={trackColor}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={color}
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                 <span className={`${textSizeClass} font-bold ${textColor}`}>
                    {`${Math.round(percentage)}%`}
                </span>
            </div>
        </div>
    );
};

export default CircularProgress;