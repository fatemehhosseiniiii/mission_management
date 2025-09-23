import React, { useMemo } from 'react';
import { useUI } from '../App';
import { useMissions } from '../contexts/MissionContext';
import { Mission, MissionStatus, User } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import CircularProgress from './ui/CircularProgress';
import TimeAnalysisChart from './TimeAnalysisChart';
import Badge from './ui/Badge';
import { useAuth } from '../contexts/AuthContext';
import jalaali from 'jalaali-js';

const toPersianDigits = (str: string | number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};
const formatPersianDate = (isoString: string): string => {
    if (!isoString || isNaN(new Date(isoString).getTime())) return ' - ';
    const date = new Date(isoString);
    const { jy, jm, jd } = jalaali.toJalaali(date);
    return toPersianDigits(`${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`);
};


const calculateMissionStats = (missions: Mission[]) => {
    const total = missions.length;
    if (total === 0) {
        return {
            total: 0,
            completed: 0,
            inProgress: 0,
            new: 0,
            completionRate: 0,
            avgDurationHours: 0,
        };
    }

    const completed = missions.filter(m => m.status === MissionStatus.COMPLETED).length;
    const inProgress = missions.filter(m => m.status === MissionStatus.IN_PROGRESS).length;
    const newMissions = missions.filter(m => m.status === MissionStatus.NEW).length;
    const completionRate = (total > 0) ? (completed / total) * 100 : 0;

    const completedMissionsWithDuration = missions
        .filter(m => m.status === MissionStatus.COMPLETED && m.reports.length > 0)
        .map(m => {
            const report = m.reports[m.reports.length - 1];
            // Ensure both departureTime and returnTime are valid before calculating duration
            if(report.departureTime && report.returnTime) {
                const start = new Date(report.departureTime).getTime();
                const end = new Date(report.returnTime).getTime();
                if(!isNaN(start) && !isNaN(end) && end > start) {
                    return (end - start) / (1000 * 60 * 60); // duration in hours
                }
            }
            return null;
        })
        .filter((duration): duration is number => duration !== null && duration > 0);

    const avgDurationHours = completedMissionsWithDuration.length > 0
        ? completedMissionsWithDuration.reduce((a, b) => a + b, 0) / completedMissionsWithDuration.length
        : 0;
        
    return {
        total,
        completed,
        inProgress,
        new: newMissions,
        completionRate,
        avgDurationHours,
    };
};

const UserPerformancePage: React.FC = () => {
    const { performanceUser, setCurrentView } = useUI();
    const { findUserById } = useAuth();
    const { missions } = useMissions();

    const user = useMemo(() => {
        if (performanceUser) return performanceUser;
        // Fallback in case the page is accessed directly without context (hypothetical)
        return findUserById(performanceUser?.id || '');
    }, [performanceUser, findUserById]);
    

    const userMissions = useMemo(() => {
        if (!user) return [];
        return missions.filter(m => m.assignedto === user.id);
    }, [missions, user]);

    const stats = useMemo(() => calculateMissionStats(userMissions), [userMissions]);

    if (!user) {
        return (
            <div className="text-center p-8">
                <h2 className="text-2xl font-semibold text-gray-700">کاربر انتخاب نشده است</h2>
                <p className="text-gray-500 mt-2">لطفا از صفحه مدیریت کاربران، یک کاربر را برای مشاهده عملکرد انتخاب کنید.</p>
                <button onClick={() => setCurrentView('USER_MANAGEMENT')} className="mt-4 text-blue-600 hover:underline">بازگشت به لیست کاربران</button>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                     <h2 className="text-3xl font-bold text-gray-800">عملکرد: {user.name}</h2>
                     <p className="text-md text-gray-500">{user.department}</p>
                </div>
                <button onClick={() => setCurrentView('USER_MANAGEMENT')} className="text-sm text-blue-600 hover:underline">&larr; بازگشت به لیست کاربران</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium text-gray-500">مجموع ماموریت‌ها</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{toPersianDigits(stats.total)}</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-medium text-gray-500">میانگین زمان انجام</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{toPersianDigits(stats.avgDurationHours.toFixed(1))} <span className="text-xl text-gray-500">ساعت</span></p>
                    </CardContent>
                </Card>
                 <Card className="md:col-span-2 flex flex-col items-center justify-center p-6">
                     <h3 className="text-lg font-semibold mb-4">نرخ تکمیل ماموریت‌ها</h3>
                     <CircularProgress percentage={stats.completionRate} />
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>تحلیل زمانی ماموریت‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                    <TimeAnalysisChart missions={userMissions} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                     <CardTitle>لیست آخرین ماموریت‌ها</CardTitle>
                </CardHeader>
                <CardContent>
                    {userMissions.length > 0 ? (
                        <ul className="divide-y divide-gray-200">
                        {userMissions.slice(0, 5).map(mission => (
                            <li key={mission.id} className="py-3 flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">{mission.subject}</p>
                                    <p className="text-sm text-gray-500">ایجاد شده در: {formatPersianDate(mission.createdat)}</p>
                                </div>
                                <Badge variant={
                                    mission.status === MissionStatus.COMPLETED ? 'success' :
                                    mission.status === MissionStatus.IN_PROGRESS ? 'info' :
                                    'destructive'
                                }>{mission.status}</Badge>
                            </li>
                        ))}
                    </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-6">ماموریتی برای این کاربر ثبت نشده است.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UserPerformancePage;