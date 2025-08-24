import React from 'react';
import { NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardIcon, BellIcon, SearchIcon, ClipboardListIcon, ToolsIcon, TargetIcon, ShieldIcon, ChevronLeftIcon, ChevronRightIcon, FlaskIcon } from './icons'; 
import { Role } from '../types';

const NavLink: React.FC<{ to: string; icon: React.ReactNode; text: string; isCollapsed: boolean, isDashboard?: boolean }> = ({ to, icon, text, isCollapsed, isDashboard = false }) => {
    return (
        <RouterNavLink 
            to={to} 
            end
            title={isCollapsed ? text : undefined}
            className={({ isActive }) => 
                `flex items-center px-4 py-2 mt-2 text-sm font-medium rounded-lg transition-all duration-300 relative ${
                    isActive 
                        ? 'bg-blue-600/20 text-white shadow-[0_0_15px_rgba(88,166,255,0.5)]' 
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                } ${isDashboard && isActive ? 'breathing-glow' : ''}`
            }
        >
            {icon}
            <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>{text}</span>
        </RouterNavLink>
    );
};

const Sidebar: React.FC<{ isCollapsed: boolean; onToggle: () => void; }> = ({ isCollapsed, onToggle }) => {
  const { user } = useAuth();

  const canInvestigate = user && [Role.Admin, Role.SecurityManager, Role.SeniorAnalyst, Role.Analyst].includes(user.role);

  return (
    <div className={`hidden md:flex flex-col material-ultra-thin rounded-none border-y-0 border-l-0 transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center h-16 transition-all duration-300 justify-center ${isCollapsed ? 'px-2' : ''}`}>
        <span className={`text-white text-2xl font-bold whitespace-nowrap transition-all duration-200 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>NIDS-XAI</span>
        {isCollapsed && <ShieldIcon className="h-8 w-8 text-blue-400" />}
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4">
          <NavLink
            to="/search"
            icon={<SearchIcon className="h-6 w-6" />}
            text="Search & Reporting"
            isCollapsed={isCollapsed}
          />
           <NavLink
            to="/dashboard"
            icon={<DashboardIcon className="h-6 w-6" />}
            text="Dashboard"
            isCollapsed={isCollapsed}
            isDashboard={true}
          />
           <NavLink
            to="/threat-center"
            icon={<TargetIcon className="h-6 w-6" />}
            text="Threat Center"
            isCollapsed={isCollapsed}
          />
           <NavLink
            to="/tools"
            icon={<ToolsIcon className="h-6 w-6" />}
            text="Cyber Toolkit"
            isCollapsed={isCollapsed}
          />
           <NavLink
            to="/inbox"
            icon={<BellIcon className="h-6 w-6" />}
            text="NIDS Inbox"
            isCollapsed={isCollapsed}
          />
           {canInvestigate && (
             <>
                <NavLink
                    to="/threat-hunting"
                    icon={<FlaskIcon className="h-6 w-6" />}
                    text="Threat Hunting"
                    isCollapsed={isCollapsed}
                />
                <NavLink
                    to="/investigations"
                    icon={<ClipboardListIcon className="h-6 w-6" />}
                    text="Investigations"
                    isCollapsed={isCollapsed}
                />
            </>
           )}
        </nav>
      </div>
       <div className="px-2 py-4 border-t border-gray-700">
        <button 
            onClick={onToggle} 
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-400 rounded-lg hover:bg-gray-700 hover:text-white"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRightIcon className="h-6 w-6" /> : <ChevronLeftIcon className="h-6 w-6" />}
          <span className={`ml-3 whitespace-nowrap transition-opacity duration-200 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>Collapse</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;