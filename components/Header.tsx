import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from './ui/Button';
import { useUI } from '../App';

const Header: React.FC = () => {
    const { user, logout } = useAuth();
    const { toggleMobileMenu } = useUI();

    return (
        <header className="flex items-center h-16 justify-between px-6 bg-white shadow-md">
            {/* 
              This container is on the LEFT on desktop (md:order-2 in RTL).
              On mobile, it's on the RIGHT (first in DOM in RTL).
              It holds the hamburger for mobile and the logout button for desktop.
            */}
            <div className="flex items-center md:order-2">
                 <button
                    onClick={toggleMobileMenu}
                    className="p-2 md:hidden text-gray-500 hover:text-gray-800 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400"
                    aria-label="باز کردن منو"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                    </svg>
                    <span className="sr-only">باز کردن منو</span>
                </button>
                <Button 
                    onClick={logout} 
                    variant="secondary" 
                    className="hidden md:inline-flex bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                    خروج
                </Button>
            </div>

            {/* 
              This container is on the RIGHT on desktop (md:order-1 in RTL).
              On mobile, it's on the LEFT (second in DOM in RTL).
              It holds the user info for both, and the logout button for mobile.
            */}
            <div className="flex items-center gap-4 md:order-1">
                <div className="flex flex-col items-start text-right">
                    <span className="text-md text-gray-800 font-semibold">{user?.name}</span>
                    <span className="text-sm text-gray-500">{user?.department}</span>
                </div>
                
                <Button 
                    onClick={logout} 
                    variant="secondary" 
                    className="md:hidden bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                    خروج
                </Button>
            </div>
        </header>
    );
};

export default Header;