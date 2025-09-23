
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Mission, MissionStatus, ChecklistItem, ChecklistState } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface MissionContextType {
    missions: Mission[];
    isLoading: boolean;
    addMission: (missionData: {
        subject: string;
        location: string;
        starttime: string;
        endtime: string;
        assignedto: string;
        checklist: ChecklistItem[];
    }) => Promise<void>;
    updateMission: (updatedMission: Mission) => Promise<void>;
    deleteMissionsByUserId: (userId: string) => Promise<void>;
    initiateDelegation: (missionId: string, targetUserId: string, reason: string) => Promise<void>;
    acceptDelegation: (missionId: string) => Promise<void>;
    rejectDelegation: (missionId: string) => Promise<void>;
    clearDelegation: (missionId: string) => Promise<void>;
}

const MissionContext = createContext<MissionContextType | undefined>(undefined);


export const MissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, users } = useAuth();
    const [missions, setMissions] = useState<Mission[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshMissions = useCallback(async () => {
        setIsLoading(true);
        try {
            const allMissions = await api.getMissions();
            setMissions(allMissions);
        } catch (error) {
            // Errors will be handled in the UI via toasts, no need to log here.
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (user && users.length > 0) {
            refreshMissions();
        } else if (!user) { 
            setMissions([]);
            setIsLoading(false);
        }
    }, [user, users, refreshMissions]);


    const addMission = async (missionData: {
        subject: string;
        location: string;
        starttime: string;
        endtime: string;
        assignedto: string;
        checklist: ChecklistItem[];
    }) => {
        if (!user || !missionData) return;
        
        const payload = {
            ...missionData,
            createdby: user.id,
        };

        await api.addMission(payload);
        await refreshMissions();
    };

    const updateMission = async (updatedMission: Mission) => {
        await api.updateMission(updatedMission);
        await refreshMissions();
    };

    const deleteMissionsByUserId = async (userId: string) => {
        await api.deleteMissionsByUserId(userId);
        await refreshMissions();
    };
    
    const initiateDelegation = async (missionId: string, targetUserId: string, reason: string) => {
        if (!user) throw new Error("User not authenticated");
        await api.delegateMissionRequest(missionId, targetUserId, reason, user.id);
        await refreshMissions();
    };

    const acceptDelegation = async (missionId: string) => {
        if (!user) throw new Error("User not authenticated");
        await api.acceptDelegation(missionId, user.id);
        await refreshMissions();
    };

    const rejectDelegation = async (missionId: string) => {
        if (!user) throw new Error("User not authenticated");
        await api.rejectDelegation(missionId, user.id);
        await refreshMissions();
    };

    const clearDelegation = async (missionId: string) => {
        if (!user) throw new Error("User not authenticated");
        await api.clearDelegation(missionId, user.id);
        await refreshMissions();
    }


    return (
        <MissionContext.Provider value={{ missions, isLoading, addMission, updateMission, deleteMissionsByUserId, initiateDelegation, acceptDelegation, rejectDelegation, clearDelegation }}>
            {children}
        </MissionContext.Provider>
    );
};

export const useMissions = (): MissionContextType => {
    const context = useContext(MissionContext);
    if (context === undefined) {
        throw new Error('useMissions must be used within a MissionProvider');
    }
    return context;
};
