
import React from 'react';
import { Link } from 'react-router-dom';

interface ToolCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    link: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, link }) => {
    return (
        <Link to={link} className="block group">
            <div className="holographic-card p-6 rounded-xl h-full flex flex-col">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-900/50 rounded-lg">
                        {icon}
                    </div>
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                </div>
                <p className="text-gray-400 mt-4 text-sm leading-relaxed flex-grow">
                    {description}
                </p>
            </div>
        </Link>
    );
};

export default ToolCard;