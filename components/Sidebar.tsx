import React, { useState } from 'react';
import { useUI } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';

const HomeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
);

const MissionsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
);

const AccountIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);

const SidebarLink: React.FC<{
    label: string;
    isActive: boolean;
    onClick: () => void;
    isSubmenu?: boolean;
    icon?: React.ReactNode;
}> = ({ label, isActive, onClick, isSubmenu = false, icon }) => {
    const activeClasses = 'bg-blue-600 text-white';
    const inactiveClasses = 'text-gray-700 hover:bg-gray-100';
    const paddingClasses = isSubmenu ? 'pr-8' : 'px-4';

    return (
        <a
            href="#"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            className={`flex items-center w-full py-2.5 rounded-md transition-colors duration-200 ${paddingClasses} ${isActive ? activeClasses : inactiveClasses}`}
        >
            {icon && <span className="ml-3">{icon}</span>}
            {isSubmenu && (
                <span className="ml-3 text-gray-500">•</span>
            )}
            <span className="font-medium text-sm">{label}</span>
        </a>
    );
};

const CollapsibleHeader: React.FC<{
    label: string;
    isOpen: boolean;
    onClick: () => void;
    icon: React.ReactNode;
}> = ({ label, isOpen, onClick, icon }) => {
    return (
        <button
            onClick={onClick}
            className="flex items-center justify-between w-full px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-md focus:outline-none"
        >
            <div className="flex items-center">
                {icon && <span className="ml-3 text-gray-500">{icon}</span>}
                <span className="font-medium text-sm">{label}</span>
            </div>
            <svg className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
        </button>
    );
};


const Sidebar: React.FC = () => {
    const { currentView, setCurrentView, openMissionModal, openUserModal, isMobileMenuOpen, toggleMobileMenu } = useUI();
    const { user } = useAuth();
    const [isEmployeeMissionMenuOpen, setIsEmployeeMissionMenuOpen] = useState(true);
    const [isAdminMissionMenuOpen, setIsAdminMissionMenuOpen] = useState(true);
    const [isAdminUserMenuOpen, setIsAdminUserMenuOpen] = useState(true);
    const [isMyAccountMenuOpen, setIsMyAccountMenuOpen] = useState(true);
    
    const handleLinkClick = (action: () => void) => {
        action();
        if (isMobileMenuOpen) {
            toggleMobileMenu();
        }
    };

    const sidebarContent = (
        <div className="flex-1 overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
                {user?.role === Role.ADMIN && (
                    <>
                        <SidebarLink
                            label="صفحه اصلی"
                            isActive={currentView === 'DASHBOARD'}
                            onClick={() => handleLinkClick(() => setCurrentView('DASHBOARD'))}
                            icon={<HomeIcon />}
                        />
                        
                        <div>
                            <CollapsibleHeader
                                label="ماموریت‌ها"
                                icon={<MissionsIcon />}
                                isOpen={isAdminMissionMenuOpen}
                                onClick={() => setIsAdminMissionMenuOpen(!isAdminMissionMenuOpen)}
                            />
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAdminMissionMenuOpen ? 'max-h-48' : 'max-h-0'}`}>
                                <div className="space-y-1 pt-1">
                                    <SidebarLink
                                        label="همه ماموریت‌ها"
                                        isActive={currentView === 'DASHBOARD'}
                                        onClick={() => handleLinkClick(() => setCurrentView('DASHBOARD'))}
                                        isSubmenu
                                    />
                                    <SidebarLink
                                        label="ماموریت‌های ثبت شده"
                                        isActive={currentView === 'CREATED_MISSIONS'}
                                        onClick={() => handleLinkClick(() => setCurrentView('CREATED_MISSIONS'))}
                                        isSubmenu
                                    />
                                    <SidebarLink
                                        label="ثبت ماموریت جدید"
                                        isActive={false}
                                        onClick={() => handleLinkClick(() => openMissionModal(null, 'CREATE'))}
                                        isSubmenu
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div>
                             <CollapsibleHeader
                                label="مدیریت کاربران"
                                icon={<UsersIcon />}
                                isOpen={isAdminUserMenuOpen}
                                onClick={() => setIsAdminUserMenuOpen(!isAdminUserMenuOpen)}
                            />
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isAdminUserMenuOpen ? 'max-h-48' : 'max-h-0'}`}>
                                <div className="space-y-1 pt-1">
                                    <SidebarLink
                                        label="لیست کاربران"
                                        isActive={currentView === 'USER_MANAGEMENT'}
                                        onClick={() => handleLinkClick(() => setCurrentView('USER_MANAGEMENT'))}
                                        isSubmenu
                                    />
                                    <SidebarLink
                                        label="ثبت کاربر جدید"
                                        isActive={false}
                                        onClick={() => handleLinkClick(() => openUserModal())}
                                        isSubmenu
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                             <CollapsibleHeader
                                label="حساب کاربری من"
                                icon={<AccountIcon />}
                                isOpen={isMyAccountMenuOpen}
                                onClick={() => setIsMyAccountMenuOpen(!isMyAccountMenuOpen)}
                            />
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isMyAccountMenuOpen ? 'max-h-48' : 'max-h-0'}`}>
                                <div className="space-y-1 pt-1">
                                    <SidebarLink
                                        label="ویرایش اطلاعات کاربری"
                                        isActive={false}
                                        onClick={() => handleLinkClick(() => openUserModal(user))}
                                        isSubmenu
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {user?.role === Role.EMPLOYEE && (
                     <>
                        
                         <SidebarLink
                            label="صفحه اصلی"
                            isActive={currentView === 'MY_MISSIONS'}
                            onClick={() => handleLinkClick(() => setCurrentView('MY_MISSIONS'))}
                            icon={<HomeIcon />}
                        />
                         <div>
                            <CollapsibleHeader
                                label="ماموریت ها"
                                icon={<MissionsIcon />}
                                isOpen={isEmployeeMissionMenuOpen}
                                onClick={() => setIsEmployeeMissionMenuOpen(!isEmployeeMissionMenuOpen)}
                            />
                            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isEmployeeMissionMenuOpen ? 'max-h-48' : 'max-h-0'}`}>
                                <div className="space-y-1 pt-1">
                                    <SidebarLink
                                        label="ماموریت‌های من"
                                        isActive={currentView === 'MY_MISSIONS'}
                                        onClick={() => handleLinkClick(() => setCurrentView('MY_MISSIONS'))}
                                        isSubmenu
                                    />
                                    <SidebarLink
                                        label="درخواست‌های ارجاع"
                                        isActive={currentView === 'DELEGATIONS'}
                                        onClick={() => handleLinkClick(() => setCurrentView('DELEGATIONS'))}
                                        isSubmenu
                                    />
                                    <SidebarLink
                                        label="ماموریت‌های ثبت شده"
                                        isActive={currentView === 'CREATED_MISSIONS'}
                                        onClick={() => handleLinkClick(() => setCurrentView('CREATED_MISSIONS'))}
                                        isSubmenu
                                    />
                                    <SidebarLink
                                        label="ثبت ماموریت جدید"
                                        isActive={false}
                                        onClick={() => handleLinkClick(() => openMissionModal(null, 'CREATE'))}
                                        isSubmenu
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </nav>
        </div>
    );

    return (
        <>
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={toggleMobileMenu}
                    aria-hidden="true"
                ></div>
            )}
            <div className={`
                flex flex-col w-64 bg-white border-l
                fixed md:static top-0 right-0 h-full z-50 
                transition-transform duration-300 ease-in-out transform
                ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}
                md:translate-x-0
            `}>
                <div className="hidden md:flex items-center justify-between h-16 border-b px-4">
                    <h1 className="text-2xl font-bold text-blue-600">مدیریت ماموریت</h1>
                </div>
                {sidebarContent}
            </div>
        </>
    );
};

export default Sidebar;