import React from 'react';
import { AppStatus } from '../types';

interface NavigationProps {
    status: AppStatus;
    onBack: () => void;
    onNext?: () => void;
    showNext?: boolean;
}

const BackArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
    </svg>
);

const NextArrowIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);


const Navigation: React.FC<NavigationProps> = ({ status, onBack, onNext, showNext }) => {
    const showBack = 
        status === AppStatus.AwaitingGoalInput ||
        status === AppStatus.AwaitingFrameworkSelection || 
        status === AppStatus.Generating || 
        status === AppStatus.Success ||
        status === AppStatus.LoadingMetadata ||
        status === AppStatus.Error;

    if (!showBack) {
        return null;
    }

    const justifyClass = showNext ? 'justify-between' : 'justify-center';

    return (
        <div className={`container mx-auto px-4 pb-4 max-w-4xl flex items-center ${justifyClass}`}>
            {showBack && (
                <button
                    onClick={onBack}
                    className="inline-flex items-center px-6 py-2 text-morandi-text-secondary font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-morandi-accent transition-colors"
                    aria-label="Go to previous step"
                >
                    <BackArrowIcon />
                    <span className="ml-2">Back</span>
                </button>
            )}
            {showNext && onNext && (
                <button
                    onClick={onNext}
                    className="inline-flex items-center px-6 py-2 bg-morandi-accent text-white font-semibold rounded-lg hover:bg-morandi-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-morandi-accent transition-colors"
                    aria-label="Go to next step"
                >
                    <span className="mr-2">Next</span>
                    <NextArrowIcon />
                </button>
            )}
        </div>
    );
};

export default Navigation;