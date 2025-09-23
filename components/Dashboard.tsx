import React, { useMemo, useEffect, useState } from 'react';
import { useMissions } from '../contexts/MissionContext';
import { Mission, MissionStatus, Role, DelegationStatus } from '../types';
import Button from './ui/Button';
import MissionCard from './MissionCard';
import MissionForm from './MissionForm';
import { useUI } from '../App';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
    const { missions } = useMissions();
    const { user: currentUser } = useAuth();
    const { 
        isMissionModalOpen, 
        missionForModal,
        modalView,
        openMissionModal,
        closeMissionModal,
        currentView,
        openDelegateModal,
    } = useUI();
    const [statusFilter, setStatusFilter] = useState<MissionStatus | 'ALL'>('ALL');


    useEffect(() => {
        setStatusFilter('ALL');
    }, [currentView]);

    const filteredMissions = useMemo(() => {
        if (!currentUser) return [];
        
        let baseMissions: Mission[] = [];

        if (currentView === 'DELEGATIONS') {
            return missions.filter(m => m.delegation_target === currentUser.id && m.delegation_status === DelegationStatus.PENDING);
        } else if (currentView === 'CREATED_MISSIONS') {
            baseMissions = missions.filter(m => m.createdby === currentUser.id);
        } else if (currentUser.role === Role.ADMIN && currentView === 'DASHBOARD') {
            baseMissions = missions;
        } else { // MY_MISSIONS
            baseMissions = missions.filter(m => m.assignedto === currentUser.id);
        }
        
        if (statusFilter === 'ALL') {
            return baseMissions;
        }
        
        return baseMissions.filter(m => m.status === statusFilter);

    }, [missions, currentView, currentUser, statusFilter]);
    
    const handleEditMission = (mission: Mission) => {
        openMissionModal(mission, 'FULL');
    };

    const handleViewReport = (mission: Mission) => {
        openMissionModal(mission, 'VIEW_REPORT');
    };

    const handleDelegate = (mission: Mission) => {
        openDelegateModal(mission);
    };

    const pageTitle = useMemo(() => {
        if (currentView === 'CREATED_MISSIONS') {
            return "ماموریت‌های ثبت شده";
        }
        if (currentView === 'DELEGATIONS') {
            return "درخواست‌های ارجاع شده به شما";
        }
        if (currentUser?.role === Role.ADMIN && currentView === 'DASHBOARD') {
            return "همه ماموریت‌ها";
        }
        return "ماموریت‌های من";
    }, [currentView, currentUser]);

    const filterOptions: { label: string; value: MissionStatus | 'ALL' }[] = [
        { label: 'همه', value: 'ALL' },
        { label: 'جدید', value: MissionStatus.NEW },
        { label: 'در حال انجام', value: MissionStatus.IN_PROGRESS },
        { label: 'تکمیل شده', value: MissionStatus.COMPLETED },
    ];


    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-gray-800">{pageTitle}</h3>
                <Button onClick={() => openMissionModal(null, 'CREATE')}>
                    ثبت ماموریت جدید
                </Button>
            </div>
            
            {currentView !== 'DELEGATIONS' && (
                <div className="mb-6 bg-white p-3 rounded-md shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1">
                        <span className="text-sm font-medium text-gray-600 shrink-0">فیلتر وضعیت:</span>
                        <div className="flex gap-1 overflow-x-auto p-2">
                            {filterOptions.map(option => (
                                <Button
                                    key={option.value}
                                    variant={statusFilter === option.value ? 'primary' : 'secondary'}
                                    onClick={() => setStatusFilter(option.value)}
                                    className="text-sm px-3 py-1 whitespace-nowrap"
                                >
                                    {option.label}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            )}


            {filteredMissions.length === 0 ? (
                 <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-dashed h-64">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold tracking-tight text-gray-700">ماموریتی یافت نشد</h3>
                        <p className="text-gray-500 mt-2">
                             {statusFilter === 'ALL' && currentView !== 'DELEGATIONS'
                                ? 'هیچ ماموریتی برای نمایش وجود ندارد.'
                                : currentView === 'DELEGATIONS'
                                ? 'هیچ درخواست ارجاع جدیدی برای شما وجود ندارد.'
                                : `هیچ ماموریتی با وضعیت "${statusFilter}" یافت نشد.`
                            }
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredMissions.map(mission => (
                        <MissionCard 
                          key={mission.id} 
                          mission={mission} 
                          onEdit={handleEditMission}
                          onViewReport={handleViewReport}
                          onDelegate={handleDelegate}
                        />
                    ))}
                </div>
            )}
            
            <MissionForm 
                isOpen={isMissionModalOpen}
                onClose={closeMissionModal}
                mission={missionForModal}
                modalView={modalView}
            />
        </>
    );
};

export default Dashboard;