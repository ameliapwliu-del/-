import React from 'react';
import { AppStatus } from '../types';

interface StatusDisplayProps {
    status: AppStatus;
    error: string | null;
}

const LoadingSpinner: React.FC<{ message: string; estimatedTime?: number }> = ({ message, estimatedTime }) => {
    const timeText = estimatedTime
        ? `(Estimated time: ~${estimatedTime}s)`
        : `(This may take a moment)`;

    return (
        <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-morandi-accent"></div>
            <p className="ml-4 text-morandi-text-secondary">
                {message} {timeText}
            </p>
        </div>
    );
};

const InitialState: React.FC = () => (
     <div className="text-center py-12 px-4">
        <div className="text-5xl mb-4" role="img" aria-label="Magnifying glass icon">🔎</div>
        <h2 className="text-2xl font-semibold text-morandi-text-primary">Begin Your Research Journey</h2>
        <p className="text-morandi-text-secondary mt-2 max-w-prose mx-auto">
            Enter a topic above to get started. The AI will find and synthesize insights from top-tier research reports for you.
        </p>
    </div>
);

const ErrorState: React.FC<{ message: string }> = ({ message }) => (
    <div className="text-center py-12 px-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="text-5xl mb-4" role="img" aria-label="Warning sign icon">⚠️</div>
        <h2 className="text-2xl font-bold text-red-700">An Error Occurred</h2>
        <p className="text-red-600 mt-2 max-w-prose mx-auto">{message}</p>
    </div>
);


const StatusDisplay: React.FC<StatusDisplayProps> = ({ status, error }) => {
    switch (status) {
        case AppStatus.Idle:
            return <InitialState />;
        case AppStatus.LoadingFrameworks:
            return <LoadingSpinner message="AI is suggesting analysis frameworks..." estimatedTime={15} />;
        case AppStatus.LoadingReport:
            return <LoadingSpinner message="Preparing to generate your report..." estimatedTime={45} />;
        case AppStatus.LoadingMetadata:
            return <LoadingSpinner message="Analyzing sources and extracting metadata..." estimatedTime={10} />;
        case AppStatus.Error:
            return <ErrorState message={error || 'An unexpected error occurred.'} />;
        default:
            return null;
    }
};

export default StatusDisplay;