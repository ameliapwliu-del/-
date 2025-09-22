import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center p-4 md:p-6 border-b border-morandi-border">
            <h1 className="text-2xl md:text-3xl font-bold text-morandi-accent">
                AI Research Report Aggregator
            </h1>
            <p className="text-morandi-text-secondary mt-2 text-sm md:text-base">
                An AI-powered tool to synthesize research reports on any topic.
            </p>
        </header>
    );
};

export default Header;