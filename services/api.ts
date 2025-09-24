import { Mission, User, NewUserData, ChecklistItem } from '../types';

const CURRENT_USER_KEY = 'currentUser';
const API_BASE_URL = 'https://missionmanagement-production.up.railway.app/api'; // Use absolute path for direct API calls

// Helper to handle API responses
const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
            // Try to parse a JSON error message from the backend
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
        } catch (e) {
            // Ignore if the response is not JSON
        }
        throw new Error(errorMessage);
    }
    // Handle success responses with no content (201 for POST, 204 for PUT/DELETE)
    if (response.status === 201 || response.status === 204) {
        return;
    }
    // For delegation actions, backend might return updated mission
    if (response.headers.get("content-type")?.includes("application/json")) {
        return response.json();
    }
    return;
};

// --- Auth API ---
const login = async (username: string, pass: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password: pass }),
    });

    const user = await handleApiResponse(response);
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    return user;
};

const logout = () => {
    localStorage.removeItem(CURRENT_USER_KEY);
};

const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(CURRENT_USER_KEY);
    if (!userJson) return null;
    return JSON.parse(userJson) as User;
};


// --- User API ---
const getUsers = async (): Promise<User[]> => {
    const response = await fetch(`${API_BASE_URL}/users`);
    const users = await handleApiResponse(response);
    return users;
};

const addUser = async (userData: User) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
    });
    await handleApiResponse(response);
};

const updateUser = async (userId: string, updatedData: Partial<NewUserData>) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData),
    });
    await handleApiResponse(response);
    
    const currentUser = getCurrentUser();
    if(currentUser?.id === userId){
        const allUsers = await getUsers();
        const refreshedUser = allUsers.find(u => u.id === userId);
        if (refreshedUser) {
           localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(refreshedUser));
        }
    }
};

const deleteUser = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
    });
    await handleApiResponse(response);
};


// --- Mission API ---
const getMissions = async (): Promise<Mission[]> => {
    const response = await fetch(`${API_BASE_URL}/missions`);
    return await handleApiResponse(response);
};

type AddMissionPayload = {
    subject: string;
    location: string;
    starttime: string;
    endtime: string;
    assignedto: string;
    checklist: ChecklistItem[];
    createdby: string;
};

const addMission = async (missionPayload: AddMissionPayload) => {
    const response = await fetch(`${API_BASE_URL}/missions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missionPayload),
    });
    await handleApiResponse(response);
};

const updateMission = async (updatedMission: Mission) => {
    const response = await fetch(`${API_BASE_URL}/missions/${updatedMission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMission),
    });
    await handleApiResponse(response);
};

const deleteMissionsByUserId = async (userId: string) => {
    const response = await fetch(`${API_BASE_URL}/missions/user/${userId}`, {
        method: 'DELETE',
    });
    await handleApiResponse(response);
};

// --- Delegation API ---

const delegateMissionRequest = async (missionId: string, targetUserId: string, reason: string, initiatorId: string) => {
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}/delegate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, reason, initiatorId }),
    });
    return handleApiResponse(response);
};

const acceptDelegation = async (missionId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    });
    return handleApiResponse(response);
};

const rejectDelegation = async (missionId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    });
    return handleApiResponse(response);
};

const clearDelegation = async (missionId: string, userId: string) => {
    const response = await fetch(`${API_BASE_URL}/missions/${missionId}/clear-delegation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
    });
    return handleApiResponse(response);
};

export const api = {
    login,
    logout,
    getCurrentUser,
    getUsers,
    addUser,
    updateUser,
    deleteUser,
    getMissions,
    addMission,
    updateMission,
    deleteMissionsByUserId,
    delegateMissionRequest,
    acceptDelegation,
    rejectDelegation,
    clearDelegation,
};
