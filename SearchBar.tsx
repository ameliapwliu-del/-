import React from 'react';
import { AppStatus } from '../types';

interface SearchBarProps {
    topic: string;
    setTopic: (topic: string) => void;
    onSearch: () => void;
    onStop: () => void;
    status: AppStatus;
}

const SearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
    </svg>
);

const StopIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
);


const SearchBar: React.FC<SearchBarProps> = ({ topic, setTopic, onSearch, onStop, status }) => {
    const isProcessActive = 
        status === AppStatus.LoadingFrameworks || 
        status === AppStatus.AwaitingFrameworkSelection ||
        status === AppStatus.LoadingReport || 
        status === AppStatus.Generating;
    
    const isInputDisabled = isProcessActive;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isInputDisabled && topic.trim()) {
            onSearch();
        }
    };
    
    const getStopButtonText = () => {
        if (status === AppStatus.Generating) return "Stop Generating";
        return "Cancel";
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto">
            <div className="relative">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a topic, e.g., 'Trends in the EV Industry'"
                    className="w-full pl-5 pr-40 py-4 bg-morandi-surface border border-morandi-border rounded-xl text-morandi-text-primary placeholder-morandi-text-secondary focus:outline-none focus:ring-2 focus:ring-morandi-accent focus:border-morandi-accent transition-all duration-300 text-lg shadow-sm"
                    disabled={isInputDisabled}
                    aria-label="Search topic"
                />
                {isProcessActive ? (
                    <button
                        type="button"
                        onClick={onStop}
                        className="absolute inset-y-0 right-0 flex items-center justify-center px-4 m-2 bg-transparent text-morandi-stop border border-morandi-stop font-semibold rounded-lg hover:bg-morandi-stop/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-morandi-surface focus:ring-morandi-stop transition-all duration-300"
                        aria-label={getStopButtonText()}
                    >
                       <StopIcon />
                       <span className="ml-2">{getStopButtonText()}</span>
                    </button>
                ) : (
                    <button
                        type="submit"
                        className="absolute inset-y-0 right-0 flex items-center justify-center px-6 m-2 bg-morandi-accent text-white font-semibold rounded-lg hover:bg-morandi-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-morandi-surface focus:ring-morandi-accent disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                        disabled={!topic.trim()}
                        aria-label="Search"
                    >
                       <SearchIcon />
                       <span className="ml-2">Search</span>
                    </button>
                )}
            </div>
        </form>
    );
};

export default SearchBar;