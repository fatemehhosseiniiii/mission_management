
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { MissionProvider } from './contexts/MissionContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import { Mission, User, Role, MissionReport, ModalView } from './types';
import UserManagement from './components/UserManagement';
import UserForm from './components/UserForm';
import DelegateMissionModal from './components/DelegateMissionModal';
import UserPerformancePage from './components/UserPerformancePage';
import { ToastProvider } from './contexts/ToastContext';
import { ToastContainer } from './components/ui/Toast';
import ViewSingleReportModal from './components/ViewSingleReportModal';

// --- UI Context ---
type View = 'DASHBOARD' | 'MY_MISSIONS' | 'USER_MANAGEMENT' | 'CREATED_MISSIONS' | 'USER_PERFORMANCE' | 'DELEGATIONS';

interface UIContextType {
    isMissionModalOpen: boolean;
    missionForModal: Mission | null;
    modalView: ModalView;
    openMissionModal: (mission: Mission | null, view: ModalView) => void;
    closeMissionModal: () => void;
    currentView: View;
    setCurrentView: (view: View) => void;
    isUserModalOpen: boolean;
    userForModal: User | null;
    openUserModal: (user?: User | null) => void;
    closeUserModal: () => void;
    isDelegateModalOpen: boolean;
    missionToDelegate: Mission | null;
    openDelegateModal: (mission: Mission) => void;
    closeDelegateModal: () => void;
    performanceUser: User | null;
    openPerformancePage: (user: User) => void;
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    isViewSingleReportModalOpen: boolean;
    reportForModal: { mission: Mission; report: MissionReport } | null;
    openViewSingleReportModal: (mission: Mission, report: MissionReport) => void;
    closeViewSingleReportModal: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
    const [missionForModal, setMissionForModal] = useState<Mission | null>(null);
    const [modalView, setModalView] = useState<ModalView>('CREATE');
    const [currentView, setCurrentView] = useState<View>('DASHBOARD');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [userForModal, setUserForModal] = useState<User | null>(null);
    const [isDelegateModalOpen, setIsDelegateModalOpen] = useState(false);
    const [missionToDelegate, setMissionToDelegate] = useState<Mission | null>(null);
    const [performanceUser, setPerformanceUser] = useState<User | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isViewSingleReportModalOpen, setIsViewSingleReportModalOpen] = useState(false);
    const [reportForModal, setReportForModal] = useState<{ mission: Mission; report: MissionReport } | null>(null);


    useEffect(() => {
        if (user) {
            if (user.role === Role.EMPLOYEE) {
                setCurrentView('MY_MISSIONS');
            } else {
                setCurrentView('DASHBOARD');
            }
        }
    }, [user]);


    const openMissionModal = (mission: Mission | null, view: ModalView) => {
        setMissionForModal(mission);
        setModalView(view);
        setIsMissionModalOpen(true);
    };

    const closeMissionModal = () => {
        setIsMissionModalOpen(false);
        setMissionForModal(null);
    };

    const openUserModal = (user: User | null = null) => {
        setUserForModal(user);
        setIsUserModalOpen(true);
    };
    const closeUserModal = () => {
        setIsUserModalOpen(false);
        setUserForModal(null);
    };

    const openDelegateModal = (mission: Mission) => {
        setMissionToDelegate(mission);
        setIsDelegateModalOpen(true);
    };

    const closeDelegateModal = () => {
        setMissionToDelegate(null);
        setIsDelegateModalOpen(false);
    };

    const openPerformancePage = (user: User) => {
        setPerformanceUser(user);
        setCurrentView('USER_PERFORMANCE');
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    const openViewSingleReportModal = (mission: Mission, report: MissionReport) => {
        setReportForModal({ mission, report });
        setIsViewSingleReportModalOpen(true);
    };
    const closeViewSingleReportModal = () => {
        setIsViewSingleReportModalOpen(false);
        setReportForModal(null);
    };


    return (
        <UIContext.Provider value={{
            isMissionModalOpen,
            missionForModal,
            modalView,
            openMissionModal,
            closeMissionModal,
            currentView,
            setCurrentView,
            isUserModalOpen,
            userForModal,
            openUserModal,
            closeUserModal,
            isDelegateModalOpen,
            missionToDelegate,
            openDelegateModal,
            closeDelegateModal,
            performanceUser,
            openPerformancePage,
            isMobileMenuOpen,
            toggleMobileMenu,
            isViewSingleReportModalOpen,
            reportForModal,
            openViewSingleReportModal,
            closeViewSingleReportModal,
        }}>
            {children}
        </UIContext.Provider>
    );
};

export const useUI = (): UIContextType => {
    const context = useContext(UIContext);
    if (!context) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
// --- End UI Context ---


const AppContent: React.FC = () => {
    const { user, isLoading } = useAuth();
    const { userForModal, currentView } = useUI();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100">
                <div className="text-center">
                    <h2 className="text-2xl font-semibold text-gray-700">در حال بارگذاری...</h2>
                    <p className="text-gray-500 mt-2">لطفا کمی صبر کنید</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Login />;
    }

    const renderContent = () => {
        switch (currentView) {
            case 'USER_MANAGEMENT':
                return <UserManagement />;
            case 'USER_PERFORMANCE':
                return <UserPerformancePage />;
            case 'DASHBOARD':
            case 'MY_MISSIONS':
            case 'CREATED_MISSIONS':
            case 'DELEGATIONS':
            default:
                return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
                    <div className="container mx-auto px-6 py-8">
                        {renderContent()}
                    </div>
                </main>
            </div>
            { user.role === 'مدیر' && <UserForm userToEdit={userForModal} /> }
            <DelegateMissionModal />
            <ViewSingleReportModal />
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <MissionProvider>
                <UIProvider>
                    <ToastProvider>
                        <AppContent />
                        <ToastContainer />
                    </ToastProvider>
                </UIProvider>
            </MissionProvider>
        </AuthProvider>
    );
};

export default App;
