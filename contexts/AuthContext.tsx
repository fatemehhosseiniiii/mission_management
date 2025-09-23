
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, Role, NewUserData } from '../types';
import { api } from '../services/api';

interface AuthContextType {
    user: User | null;
    users: User[];
    isLoading: boolean;
    login: (username: string, pass: string) => Promise<void>;
    logout: () => void;
    findUserById: (id: string) => User | undefined;
    addUser: (userData: NewUserData) => Promise<void>;
    updateUser: (userId: string, updatedData: Partial<NewUserData>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUsers = useCallback(async () => {
        try {
            const allUsers = await api.getUsers();
            setUsers(allUsers);
        } catch (error) {
            // Error is handled in the UI via toasts, no need to log here.
        }
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            await refreshUsers();
            const currentUser = api.getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
            }
            setIsLoading(false);
        };
        loadInitialData();
    }, [refreshUsers]);

    const login = async (username: string, pass: string) => {
        const loggedInUser = await api.login(username, pass);
        setUser(loggedInUser);
        await refreshUsers(); // Refresh user list just in case
    };

    const logout = () => {
        api.logout();
        setUser(null);
    };

    const findUserById = (id: string): User | undefined => {
        return users.find(u => u.id === id);
    };

    const addUser = async (userData: NewUserData) => {
        const newUser: User = {
            ...userData,
            id: `U${Date.now()}`,
            role: Role.EMPLOYEE,
            createdat: new Date().toISOString(),
        };
        await api.addUser(newUser);
        await refreshUsers();
    };

    const updateUser = async (userId: string, updatedData: Partial<NewUserData>) => {
        await api.updateUser(userId, updatedData);
        await refreshUsers();
        // Also update the currently logged-in user state if they are the one being edited
        if (user?.id === userId) {
            setUser(api.getCurrentUser());
        }
    };

    const deleteUser = async (userId: string) => {
        if (user?.id === userId) {
            throw new Error("شما نمی توانید حساب کاربری خود را حذف کنید.");
        }
        await api.deleteUser(userId);
        await refreshUsers();
    };


    return (
        <AuthContext.Provider value={{ user, users, isLoading, login, logout, findUserById, addUser, updateUser, deleteUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
