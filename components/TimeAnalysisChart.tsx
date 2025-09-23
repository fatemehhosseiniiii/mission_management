import React, { useMemo } from 'react';
import { Mission, MissionStatus } from '../types';
import jalaali from 'jalaali-js';

interface TimeAnalysisChartProps {
    missions: Mission[];
}

const monthNames = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
];

const TimeAnalysisChart: React.FC<TimeAnalysisChartProps> = ({ missions }) => {
    const chartData = useMemo(() => {
        const data: { [key: string]: { completed: number; created: number } } = {};
        const today = new Date();
        const { jy: currentYear, jm: currentMonth } = jalaali.toJalaali(today);

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            let month = currentMonth - i;
            let year = currentYear;
            if (month <= 0) {
                month += 12;
                year -= 1;
            }
            const key = `${year}-${String(month).padStart(2, '0')}`;
            data[key] = { completed: 0, created: 0 };
        }
        
        missions.forEach(mission => {
            // Created missions
            const createdDate = new Date(mission.createdat);
            if (!isNaN(createdDate.getTime())) {
                const { jy, jm } = jalaali.toJalaali(createdDate);
                const key = `${jy}-${String(jm).padStart(2, '0')}`;
                if (data[key]) {
                    data[key].created += 1;
                }
            }

            // Completed missions
            if (mission.status === MissionStatus.COMPLETED && mission.reports.length > 0) {
                const reportDate = new Date(mission.reports[mission.reports.length - 1].createdAt);
                 if (!isNaN(reportDate.getTime())) {
                    const { jy, jm } = jalaali.toJalaali(reportDate);
                    const key = `${jy}-${String(jm).padStart(2, '0')}`;
                    if (data[key]) {
                        data[key].completed += 1;
                    }
                }
            }
        });

        return Object.entries(data).map(([key, value]) => {
            const [, month] = key.split('-').map(Number);
            return {
                name: monthNames[month - 1],
                ...value
            };
        });
    }, [missions]);

    const maxCount = useMemo(() => {
        const max = Math.max(...chartData.map(d => Math.max(d.created, d.completed)));
        return max === 0 ? 5 : max; // Avoid division by zero and have a baseline height
    }, [chartData]);

    if (missions.length === 0) {
        return <p className="text-center text-gray-500 py-10">داده‌ای برای نمایش نمودار وجود ندارد.</p>
    }

    return (
        <div>
            <div className="flex justify-center items-end h-64 w-full space-x-2 space-x-reverse px-4 border-b border-gray-200">
                {chartData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                        <div className="flex items-end w-full max-w-[60px] h-full gap-1">
                             <div className="w-1/2 bg-blue-200 rounded-t-md hover:bg-blue-300" style={{ height: `${(data.created / maxCount) * 100}%`, transition: 'height 0.3s ease-in-out' }} title={`ایجاد شده: ${data.created}`}></div>
                            <div className="w-1/2 bg-green-200 rounded-t-md hover:bg-green-300" style={{ height: `${(data.completed / maxCount) * 100}%`, transition: 'height 0.3s ease-in-out' }} title={`تکمیل شده: ${data.completed}`}></div>
                        </div>
                        <span className="mt-2 text-xs text-gray-500">{data.name}</span>
                    </div>
                ))}
            </div>
             <div className="flex justify-center items-center mt-4 space-x-4 space-x-reverse text-sm">
                <div className="flex items-center">
                    <span className="w-3 h-3 bg-blue-200 rounded-sm ml-2"></span>
                    <span>ایجاد شده</span>
                </div>
                 <div className="flex items-center">
                    <span className="w-3 h-3 bg-green-200 rounded-sm ml-2"></span>
                    <span>تکمیل شده</span>
                </div>
            </div>
        </div>
    );
};

export default TimeAnalysisChart;
