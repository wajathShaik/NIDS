import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ShieldIcon, UserIcon, LogOutIcon } from './icons';
import NotificationBell from './NotificationBell';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 material-thin rounded-none border-x-0 border-t-0">
      <Link to="/search" className="flex items-center cursor-pointer">
        <ShieldIcon className="h-6 w-6 text-blue-500" />
        <span className="text-lg font-semibold text-white ml-2">NIDS-XAI</span>
      </Link>
      {user && (
        <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="relative">
                <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="flex items-center gap-2 text-sm focus:outline-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                    <div>
                        <p className="text-white font-medium text-left">{user.email}</p>
                        <p className="text-gray-400 text-xs capitalize text-left">{user.role} | {user.department}</p>
                    </div>
                </button>
                 {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 material-regular rounded-md py-1 z-50">
                        <Link to="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600" onClick={() => setIsDropdownOpen(false)}>
                            Profile & Settings
                        </Link>
                         <button
                            onClick={logout}
                            className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-gray-600 focus:outline-none"
                            title="Logout"
                          >
                            <LogOutIcon className="h-5 w-5" />
                            Logout
                          </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </header>
  );
};

export default Header;