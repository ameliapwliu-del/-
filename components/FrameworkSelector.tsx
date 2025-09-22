import React from 'react';
import { Framework } from '../types';

interface FrameworkSelectorProps {
    frameworks: Framework[];
    onSelect: (framework: Framework) => void;
    onRegenerate: () => void;
    selectedFramework: Framework | null;
}

const RegenerateIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 110 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
    </svg>
);


const FrameworkSelector: React.FC<FrameworkSelectorProps> = ({ frameworks, onSelect, onRegenerate, selectedFramework }) => {
    return (
        <div className="p-6 bg-morandi-surface/50 border border-morandi-border rounded-lg shadow-sm animate-fade-in">
            <div className="text-center">
                <h2 className="text-xl font-bold text-morandi-accent mb-4">
                    Please select an analysis framework
                </h2>
                <p className="text-morandi-text-secondary mb-6">
                    The AI suggests the following custom frameworks for an in-depth analysis of your topic.
                </p>
            </div>
            <div className="space-y-4">
                {frameworks.map((framework) => {
                    const isSelected = selectedFramework?.name_en === framework.name_en;
                    return (
                        <button
                            key={framework.name_en}
                            onClick={() => onSelect(framework)}
                            className={`p-4 w-full text-left bg-morandi-surface rounded-lg border group hover:shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-morandi-accent ${isSelected ? 'border-morandi-accent ring-2 ring-morandi-accent' : 'border-morandi-border hover:border-morandi-accent'}`}
                        >
                            <h3 className="font-bold text-lg text-morandi-text-primary group-hover:text-morandi-accent transition-colors">
                                {framework.name_zh} ({framework.name_en})
                            </h3>
                            <p className="text-morandi-text-secondary text-sm mt-2">
                               {framework.advantage}
                            </p>
                        </button>
                    )
                })}
            </div>
            <div className="mt-6 pt-4 border-t border-morandi-border/50 text-center">
                 <button
                    onClick={onRegenerate}
                    className="inline-flex items-center px-4 py-2 text-sm text-morandi-text-secondary font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-morandi-accent transition-colors"
                >
                    <RegenerateIcon />
                    <span className="ml-2">Not satisfied? Regenerate suggestions</span>
                </button>
            </div>
        </div>
    );
};

export default FrameworkSelector;