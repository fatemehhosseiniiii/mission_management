import React from 'react';
import { Mission } from '../types';
import jalaali from 'jalaali-js';

interface MissionReportViewProps {
    mission: Mission;
}

const toPersianDigits = (str: string | number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

// Helper to format ISO date string to Persian date and time (e.g., "۱۴۰۴/۰۶/۳۰ ۰۱:۲۴")
const formatMissionDateTime = (isoString: string): string => {
    if (!isoString || isNaN(new Date(isoString).getTime())) return ' - ';
    const date = new Date(isoString);
    const { jy, jm, jd } = jalaali.toJalaali(date);
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const shamsiDate = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    return toPersianDigits(`${shamsiDate} ${time}`);
};

// Helper component to display a label and its value with the new layout
const InfoItem: React.FC<{ label: string; value: string; breakWord?: boolean }> = ({ label, value, breakWord }) => (
    <div>
        <p className="text-gray-500">{label}</p>
        <p className={`font-semibold text-gray-800 ${breakWord ? 'break-words' : ''}`}>{value || '-'}</p>
    </div>
);


const MissionReportView: React.FC<MissionReportViewProps> = ({ mission }) => {
    return (
        <fieldset className="px-4 pt-2 pb-4 border rounded-md bg-gray-50">
            <legend className="text-lg font-semibold px-2 text-gray-700">خلاصه ماموریت</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <div className="space-y-2">
                    <InfoItem label="موضوع" value={mission.subject} breakWord />
                    <InfoItem label="زمان شروع" value={formatMissionDateTime(mission.starttime)} />
                </div>
                <div className="space-y-2">
                    <InfoItem label="محل" value={mission.location} breakWord />
                    <InfoItem label="زمان پایان" value={formatMissionDateTime(mission.endtime)} />
                </div>
            </div>
        </fieldset>
    );
};

export default MissionReportView;