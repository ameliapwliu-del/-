import React, { useState, useEffect } from 'react';
import { SearchResult, AppStatus } from '../types';
import ResultCard from './ResultCard';

interface ResultsDisplayProps {
    results: SearchResult | null;
    status: AppStatus;
}

// A component to render text, handling bullet points and citation markers.
const ContentRenderer: React.FC<{ text: string }> = ({ text }) => {
    // Filter out empty lines from the beginning to prevent unwanted space
    const lines = text.split('\n');
    let firstLineIndex = -1;
    for(let i=0; i<lines.length; i++) {
        if(lines[i].trim() !== '') {
            firstLineIndex = i;
            break;
        }
    }
    
    const relevantLines = firstLineIndex === -1 ? [] : lines.slice(firstLineIndex);

    const renderLine = (line: string) => {
        if (!line) return null;
        // Regex to find citation markers like [1], [2, 3], [4-6]
        const citationRegex = /(\[[\d\s,-]+\])/g;
        const parts = line.split(citationRegex);

        return parts.map((part, i) => {
            // Create a new regex instance for each test
            const testRegex = new RegExp(citationRegex);
            if (testRegex.test(part)) {
                return <sup key={i} className="text-morandi-accent font-semibold ml-1" title="Source Citation">{part}</sup>;
            }
            return part;
        });
    };

    return (
        <div className="space-y-3 text-base leading-relaxed text-morandi-text-secondary">
            {relevantLines.map((line, index) => {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
                    const content = trimmedLine.substring(2);
                    return (
                        <div key={index} className="flex items-start pl-4">
                            <span className="mr-3 mt-2 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-morandi-accent"></span>
                            <span>{renderLine(content)}</span>
                        </div>
                    );
                }
                if (trimmedLine) {
                    return <p key={index}>{renderLine(trimmedLine)}</p>;
                }
                // Render a small break for empty lines to create paragraph spacing
                if (index > 0 && relevantLines[index-1].trim() !== '') {
                     return <div key={index} className="h-2"></div>;
                }
                return null;
            })}
        </div>
    );
};

// A hook to create a typewriter effect for streaming text
const useTypewriter = (targetText: string, options: { enabled: boolean; speed?: number }): string => {
    const { enabled, speed = 15 } = options;
    const [displayedText, setDisplayedText] = useState<string>('');
    const textToShow = enabled ? displayedText : targetText;

    useEffect(() => {
        if (!enabled) {
            // When streaming stops, ensure the full text is shown.
            // This also handles the initial render when results already exist.
            if (displayedText !== targetText) {
                setDisplayedText(targetText);
            }
            return;
        }

        // Heuristic for reset: if the target doesn't start with the current text, it's a reset.
        if (targetText.length > 0 && !targetText.startsWith(displayedText)) {
            setDisplayedText(''); // This will trigger the typing effect in the next check
            return;
        }

        // The typing effect
        if (displayedText.length < targetText.length) {
            const timer = setTimeout(() => {
                const charsToAdd = Math.min(targetText.length - displayedText.length, 3);
                setDisplayedText(targetText.slice(0, displayedText.length + charsToAdd));
            }, speed);
            return () => clearTimeout(timer);
        }

    }, [enabled, targetText, displayedText, speed]);

    return textToShow;
};


const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, status }) => {
    if (!results) {
        return null;
    }
    
    const isStreaming = status === AppStatus.Generating;
    const animatedSummary = useTypewriter(results.overallSummary, { enabled: isStreaming });
    // Show cursor only when streaming and there is text being displayed
    const showCursor = isStreaming && animatedSummary.length > 0;


    return (
        <div className="space-y-12 animate-fade-in">
            {/* AI Synthesis (Summary) Section */}
            <section>
                <div className="flex justify-between items-center mb-4 border-b border-morandi-border pb-2">
                     <h2 className="text-xl font-bold text-morandi-accent">AI Synthesis</h2>
                    {isStreaming && (
                         <div className="flex items-center text-sm text-morandi-text-secondary">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-morandi-accent mr-2"></div>
                            <span>Generating... (Est. ~45s)</span>
                        </div>
                    )}
                </div>
                <div className="p-6 bg-morandi-surface rounded-lg shadow-inner min-h-[100px]">
                    <ContentRenderer text={animatedSummary} />
                    {showCursor && <span className="inline-block w-2 h-5 bg-morandi-text-primary animate-pulse ml-1 translate-y-1"></span>}
                </div>
            </section>

            {/* Framework Analysis Section */}
            {results.analysis && results.analysis.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-morandi-accent mb-4 border-b border-morandi-border pb-2">Framework Analysis</h2>
                    <div className="space-y-6">
                        {results.analysis.map((section) => 
                            <div key={section.title} className="p-6 bg-morandi-surface border border-morandi-border rounded-lg shadow-sm transition-all hover:border-morandi-accent">
                                <h3 className="font-bold text-lg text-morandi-text-primary mb-3">{section.title}</h3>
                                <ContentRenderer text={section.content} />
                                {section.sources && (
                                    <div className="mt-4 pt-3 border-t border-morandi-border/50 text-xs text-morandi-text-secondary">
                                        <span className="font-semibold">Sources for this section: </span>
                                        <span className="font-mono">{section.sources}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}
            
            {/* Sources Section */}
            {results.sources.length > 0 && (
                <section>
                    <h2 className="text-xl font-bold text-morandi-accent mb-4 border-b border-morandi-border pb-2">Sources & Citations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {results.sources.map((source, index) => (
                           <ResultCard key={index} source={source} number={index + 1} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default ResultsDisplay;