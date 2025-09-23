import React from 'react';
import { Mission, MissionStatus, Role, DelegationStatus } from '../types';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useMissions } from '../contexts/MissionContext';
import { useToast } from '../contexts/ToastContext';
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


interface MissionCardProps {
    mission: Mission;
    onEdit: (mission: Mission) => void;
    onViewReport: (mission: Mission) => void;
    onDelegate: (mission: Mission) => void;
}


const UserInfo: React.FC<{ userId: string; label: string }> = ({ userId, label }) => {
    const { findUserById } = useAuth();
    const user = findUserById(userId);
    return (
        <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{label}: </span>
            {user ? user.name : 'کاربر یافت نشد'}
        </div>
    );
};

const DelegationStatusDisplay: React.FC<{ mission: Mission }> = ({ mission }) => {
    const { findUserById } = useAuth();
    const { clearDelegation } = useMissions();
    const { addToast } = useToast();

    if (!mission.delegation_status) return null;

    const targetUser = findUserById(mission.delegation_target || '');
    const statusTextMap = {
        [DelegationStatus.PENDING]: `در انتظار تایید ${targetUser?.name || ''}`,
        [DelegationStatus.ACCEPTED]: `تایید شده توسط ${targetUser?.name || ''}`,
        [DelegationStatus.REJECTED]: `رد شده توسط ${targetUser?.name || ''}`,
    };
    const statusColorMap = {
        [DelegationStatus.PENDING]: 'bg-yellow-100 border-yellow-400 text-yellow-800',
        [DelegationStatus.ACCEPTED]: 'bg-green-100 border-green-400 text-green-800',
        [DelegationStatus.REJECTED]: 'bg-red-100 border-red-400 text-red-800',
    };

    const handleClear = async () => {
        try {
            await clearDelegation(mission.id);
            addToast("وضعیت ارجاع پاک شد.", "success");
        } catch(e) {
            addToast("خطا در پاک کردن وضعیت ارجاع.", "error");
        }
    }

    return (
        <div className={`mt-3 p-2 rounded-md border-r-4 ${statusColorMap[mission.delegation_status]}`}>
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-xs font-semibold">وضعیت ارجاع:</p>
                    <p className="text-xs">{statusTextMap[mission.delegation_status]}</p>
                </div>
                {(mission.delegation_status === DelegationStatus.ACCEPTED || mission.delegation_status === DelegationStatus.REJECTED) && (
                    <button onClick={handleClear} className="text-xs text-gray-500 hover:underline p-1">پاک کردن</button>
                )}
            </div>
        </div>
    );
};

const DelegationRequestInfo: React.FC<{ mission: Mission }> = ({ mission }) => {
    const { findUserById } = useAuth();
    if (!mission.delegated_by || !mission.delegation_reason) return null;

    const initiator = findUserById(mission.delegated_by);

    return (
        <div className="mt-3 p-3 rounded-md border-r-4 border-yellow-400 bg-yellow-50">
            <p className="text-sm font-semibold text-yellow-900">
                ارجاع شده توسط: <span className="font-bold">{initiator?.name || 'ناشناس'}</span>
            </p>
            <p className="text-sm text-yellow-800 mt-1 italic">
                "{mission.delegation_reason}"
            </p>
        </div>
    );
};


const MissionCard: React.FC<MissionCardProps> = ({ mission, onEdit, onViewReport, onDelegate }) => {
    const { user } = useAuth();
    const { acceptDelegation, rejectDelegation } = useMissions();
    const { addToast } = useToast();

    const statusClasses = {
        [MissionStatus.NEW]: 'bg-red-100 text-red-800',
        [MissionStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
        [MissionStatus.COMPLETED]: 'bg-green-100 text-green-800',
    };

    const isDelegationTarget = user?.id === mission.delegation_target && mission.delegation_status === DelegationStatus.PENDING;
    const isDelegationInitiator = user?.id === mission.delegated_by;
    const isPendingDelegation = mission.delegation_status === DelegationStatus.PENDING;

    const handleAccept = async () => {
        try {
            await acceptDelegation(mission.id);
            addToast("ماموریت با موفقیت دریافت شد.", "success");
        } catch(e) {
            addToast("خطا در دریافت ماموریت.", "error");
        }
    };
    
    const handleReject = async () => {
        try {
            await rejectDelegation(mission.id);
            addToast("درخواست ارجاع رد شد.", "success");
        } catch(e) {
            addToast("خطا در رد درخواست.", "error");
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-col hover:shadow-lg transition-shadow duration-200">
            <div className="flex-1">
                 <div className="flex justify-between items-start mb-2">
                    <h4 className="text-md font-bold text-gray-800 break-words">{mission.subject}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClasses[mission.status]}`}>
                        {mission.status}
                    </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">{mission.location}</p>
                 <div className="space-y-1">
                    <UserInfo userId={mission.createdby} label="ایجاد کننده" />
                    <UserInfo userId={mission.assignedto} label="مسئول انجام" />
                     <div className="text-sm text-gray-500">
                        <span className="font-semibold text-gray-700">تاریخ ایجاد: </span>
                        {formatPersianDate(mission.createdat)}
                    </div>
                </div>
                {isDelegationInitiator && (
                   <DelegationStatusDisplay mission={mission} />
                )}
                {isDelegationTarget && (
                   <DelegationRequestInfo mission={mission} />
                )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
                {isDelegationTarget ? (
                     <div className="flex w-full items-center gap-2">
                        <Button onClick={handleReject} variant='danger' className="text-sm flex-1">
                            رد ماموریت
                        </Button>
                        <Button onClick={handleAccept} className="text-sm flex-1 bg-green-600 hover:bg-green-700 focus:ring-green-500">
                           دریافت ماموریت
                        </Button>
                    </div>
                ) : user?.id === mission.assignedto ? (
                    mission.status === MissionStatus.COMPLETED ? (
                        <Button onClick={() => onViewReport(mission)} variant="secondary" className="w-full text-sm">
                            مشاهده گزارش
                        </Button>
                    ) : ( // NEW or IN_PROGRESS
                         <div className="flex w-full items-center gap-2">
                            <Button onClick={() => onDelegate(mission)} variant='secondary' className="text-sm flex-1" disabled={isPendingDelegation}>
                                ارجاع
                            </Button>
                            <Button onClick={() => onEdit(mission)} variant='primary' className="text-sm flex-1">
                               ثبت/مشاهده گزارش
                            </Button>
                        </div>
                    )
                ) : 
                (user?.id === mission.createdby || user?.role === Role.ADMIN) && (
                    <Button onClick={() => onViewReport(mission)} variant="secondary" className="w-full text-sm">
                        مشاهده گزارش
                    </Button>
                )}
            </div>
        </div>
    );
};

export default MissionCard;