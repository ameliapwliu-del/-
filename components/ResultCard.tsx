import React from 'react';
import { StructuredSource } from '../types';

interface ResultCardProps {
    source: StructuredSource;
    number: number;
}

const LinkIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
);


const ResultCard: React.FC<ResultCardProps> = ({ source, number }) => {
    const publicationDate = source.publicationDate;
    const reportName = source.reportName;

    return (
        <a
            href={source.web.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between p-4 bg-morandi-surface rounded-lg border border-morandi-border hover:border-morandi-accent hover:shadow-md transition-all duration-300 group h-full"
        >
            <div>
                 <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-morandi-text-secondary pr-2">報告名稱</p>
                    <div className="flex-shrink-0 flex items-center justify-center h-6 w-6 bg-morandi-accent/10 text-morandi-accent rounded-full font-bold text-sm">
                        {number}
                    </div>
                </div>
                <h3 className="font-semibold text-morandi-text-primary group-hover:text-morandi-accent transition-colors">
                    {reportName}
                </h3>
            </div>
            
            <div className="mt-4">
                 <div className="mb-3">
                    <p className="text-xs text-morandi-text-secondary mb-1">發布日期</p>
                    {publicationDate ? (
                        <p className="text-sm text-morandi-text-primary">{publicationDate}</p>
                    ) : (
                        <p className="text-sm text-morandi-text-secondary italic">未找到</p>
                    )}
                </div>

                <div className="flex items-center text-sm text-morandi-accent pt-3 border-t border-morandi-border/50">
                    <span>訪問來源</span>
                    <LinkIcon />
                </div>
            </div>
        </a>
    );
};

export default ResultCard;