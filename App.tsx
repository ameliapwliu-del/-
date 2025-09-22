import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import ResultsDisplay from './components/ResultsDisplay';
import StatusDisplay from './components/StatusDisplay';
import FrameworkSelector from './components/FrameworkSelector';
import Navigation from './components/Navigation';
import HistorySidebar from './components/HistorySidebar';
import GoalForm from './components/GoalForm';
import { AppStatus, SearchResult, Framework, ResearchSession, StructuredSource } from './types';
import { suggestFrameworks, generateReportStream, parseMarkdownReport, extractSourceMetadata } from './services/geminiService';

const LOCAL_STORAGE_KEY = 'ai-research-sessions';
const SIDEBAR_STATE_KEY = 'ai-research-sidebar-open';

const ExpandSidebarIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
);

const App: React.FC = () => {
    const [sessions, setSessions] = useState<ResearchSession[]>(() => {
        try {
            const savedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedSessions) {
                const parsedSessions: ResearchSession[] = JSON.parse(savedSessions);
                // Add default values for backward compatibility
                return parsedSessions.map(s => ({
                    ...s,
                    objective: s.objective || '',
                    scope: s.scope || '',
                }));
            }
            return [];
        } catch (error) {
            console.error("Failed to load sessions from localStorage", error);
            return [];
        }
    });

    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [inputTopic, setInputTopic] = useState<string>('');
    const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
        try {
            const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
            return savedState ? JSON.parse(savedState) : true;
        } catch {
            return true;
        }
    });
    
    const abortControllerRef = useRef<AbortController | null>(null);

    const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);

    useEffect(() => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
        } catch (error) {
            console.error("Failed to save sessions to localStorage", error);
        }
    }, [sessions]);

    useEffect(() => {
        try {
            localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isSidebarOpen));
        } catch (error) {
            console.error("Failed to save sidebar state to localStorage", error);
        }
    }, [isSidebarOpen]);

    useEffect(() => {
        if (!currentSessionId && sessions.length > 0) {
            const mostRecentSession = [...sessions].sort((a, b) => b.createdAt - a.createdAt)[0];
            setCurrentSessionId(mostRecentSession.id);
            setInputTopic(mostRecentSession.topic);
        } else if (!currentSessionId || sessions.length === 0) {
            handleNewResearch();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    const updateSession = useCallback((sessionId: string, updates: Partial<ResearchSession>) => {
        setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, ...updates } : s));
    }, []);

    const cancelCurrentOperation = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
    }, []);
    
    const handleNewResearch = useCallback(() => {
        cancelCurrentOperation();
        const newSessionId = Date.now().toString();
        const newSession: ResearchSession = {
            id: newSessionId,
            topic: '',
            objective: '',
            scope: '',
            status: AppStatus.Idle,
            results: null,
            error: null,
            frameworks: [],
            selectedFramework: null,
            createdAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSessionId);
        setInputTopic('');
    }, [cancelCurrentOperation]);

    const handleSuggestFrameworks = useCallback(async (sessionId: string, topic: string, objective: string, scope: string) => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        updateSession(sessionId, {
            status: AppStatus.LoadingFrameworks,
            error: null,
            frameworks: [],
        });

        try {
            const suggested = await suggestFrameworks({ topic, objective, scope });
            if (controller.signal.aborted) return;

            if (suggested && suggested.length > 0) {
                updateSession(sessionId, { frameworks: suggested, status: AppStatus.AwaitingFrameworkSelection });
            } else {
                updateSession(sessionId, { error: 'The AI could not suggest any analysis frameworks for this topic. Please try rephrasing.', status: AppStatus.Error });
            }
        } catch (err: any) {
            if (!controller.signal.aborted) {
                updateSession(sessionId, { error: err.message || 'An unknown error occurred while suggesting frameworks.', status: AppStatus.Error });
            }
        }
    }, [updateSession]);
    
    const handleGoalSubmit = useCallback(async ({ objective, scope }: { objective: string; scope: string }) => {
        if (!currentSessionId || !currentSession) return;

        updateSession(currentSessionId, { objective, scope });
        handleSuggestFrameworks(currentSessionId, currentSession.topic, objective, scope);
    }, [currentSession, currentSessionId, handleSuggestFrameworks, updateSession]);

    const handleSearch = useCallback(() => {
        if (!inputTopic.trim()) return;
        cancelCurrentOperation();

        const newSessionId = Date.now().toString();
        const newSession: ResearchSession = {
            id: newSessionId,
            topic: inputTopic,
            objective: '',
            scope: '',
            status: AppStatus.AwaitingGoalInput,
            results: null,
            error: null,
            frameworks: [],
            selectedFramework: null,
            createdAt: Date.now(),
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSessionId);
    }, [inputTopic, cancelCurrentOperation]);
    
    const handleFrameworkSelect = useCallback(async (framework: Framework) => {
        if (!currentSessionId || !currentSession?.topic) return;
        
        const controller = new AbortController();
        abortControllerRef.current = controller;

        updateSession(currentSessionId, {
            selectedFramework: framework,
            status: AppStatus.Generating,
            error: null,
            results: { overallSummary: '', analysis: [], sources: [] },
        });
        
        let fullText = "";

        try {
            const frameworkNameForPrompt = `${framework.name_zh} (${framework.name_en})`;
            await generateReportStream({
                topic: currentSession.topic, 
                framework: frameworkNameForPrompt,
                signal: controller.signal,
                onStreamUpdate: (chunk) => {
                    fullText += chunk;
                    setSessions(prev => prev.map(s => 
                        s.id === currentSessionId ? { ...s, results: { ...s.results!, overallSummary: fullText } } : s
                    ));
                },
                onStreamEnd: async (sources) => {
                    if (controller.signal.aborted) return;
                    
                    const parsedData = parseMarkdownReport(fullText);
                    const preliminarySources: StructuredSource[] = sources.map(s => ({
                        ...s,
                        reportName: s.web.title,
                        publicationDate: null
                    }));

                    updateSession(currentSessionId, { 
                        results: { ...parsedData, sources: preliminarySources },
                        status: AppStatus.LoadingMetadata
                    });

                    const structuredInfo = await extractSourceMetadata(sources);
                    if (controller.signal.aborted) return;
                    
                    const finalSources: StructuredSource[] = sources.map((source, index) => ({
                        ...source,
                        reportName: structuredInfo[index]?.reportName || source.web.title,
                        publicationDate: structuredInfo[index]?.publicationDate || null,
                    }));

                    updateSession(currentSessionId, {
                        results: { ...parsedData, sources: finalSources },
                        status: AppStatus.Success
                    });
                    
                    abortControllerRef.current = null;
                }
            });
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                 updateSession(currentSessionId, { error: err.message || `An error occurred while generating the report.`, status: AppStatus.Error });
            }
        }
    }, [currentSessionId, currentSession?.topic, updateSession]);

    const handleStopGenerating = useCallback(() => {
        cancelCurrentOperation();
        if (currentSessionId && currentSession?.results?.overallSummary) {
            const parsedData = parseMarkdownReport(currentSession.results.overallSummary);
            updateSession(currentSessionId, { 
                results: { ...parsedData, sources: currentSession.results.sources || [] },
                status: AppStatus.Success 
            });
        } else if (currentSessionId) {
            updateSession(currentSessionId, { status: AppStatus.Success });
        }
    }, [cancelCurrentOperation, currentSession, currentSessionId, updateSession]);
    
    const handleStopOrCancel = useCallback(() => {
        if (currentSession?.status === AppStatus.Generating || currentSession?.status === AppStatus.LoadingMetadata) {
            handleStopGenerating();
        } else {
            handleNewResearch();
        }
    }, [currentSession, handleStopGenerating, handleNewResearch]);

    const handleBack = useCallback(() => {
        if (!currentSessionId || !currentSession) return;
        cancelCurrentOperation();
        
        const { status } = currentSession;

        if (status === AppStatus.Generating || status === AppStatus.Success || status === AppStatus.Error || status === AppStatus.LoadingMetadata) {
            updateSession(currentSessionId, { status: AppStatus.AwaitingFrameworkSelection, error: null });
        } else if (status === AppStatus.AwaitingFrameworkSelection) {
            updateSession(currentSessionId, { status: AppStatus.AwaitingGoalInput, error: null, frameworks: [] });
        } else if (status === AppStatus.AwaitingGoalInput) {
            handleNewResearch();
        }
    }, [currentSession, currentSessionId, cancelCurrentOperation, updateSession, handleNewResearch]);

    const handleNext = useCallback(() => {
        if (!currentSessionId || !currentSession) return;
        
        // Allow moving from framework selection to an existing report
        if (currentSession.status === AppStatus.AwaitingFrameworkSelection && currentSession.results) {
            updateSession(currentSessionId, { status: AppStatus.Success });
        }
    }, [currentSession, currentSessionId, updateSession]);

    const handleRegenerateFrameworks = useCallback(() => {
        if (!currentSessionId || !currentSession) return;
        handleSuggestFrameworks(currentSessionId, currentSession.topic, currentSession.objective, currentSession.scope);
    }, [currentSessionId, currentSession, handleSuggestFrameworks]);

    const handleSelectSession = useCallback((sessionId: string) => {
        cancelCurrentOperation();
        setCurrentSessionId(sessionId);
        const selectedSession = sessions.find(s => s.id === sessionId);
        setInputTopic(selectedSession?.topic || '');
    }, [sessions, cancelCurrentOperation]);

    const handleDeleteSession = useCallback((sessionIdToDelete: string) => {
        const remainingSessions = sessions.filter(s => s.id !== sessionIdToDelete);
        
        if (currentSessionId === sessionIdToDelete) {
            if (remainingSessions.length > 0) {
                const mostRecent = [...remainingSessions].sort((a, b) => b.createdAt - a.createdAt)[0];
                handleSelectSession(mostRecent.id);
            } else {
                handleNewResearch();
            }
        }
        
        setSessions(remainingSessions);
    }, [sessions, currentSessionId, handleSelectSession, handleNewResearch]);

    const handleRenameSession = useCallback((sessionId: string, newTopic: string) => {
        setSessions(prev => 
            prev.map(s => s.id === sessionId ? { ...s, topic: newTopic } : s)
        );
        if (currentSessionId === sessionId) {
            setInputTopic(newTopic);
        }
    }, [currentSessionId]);

    const showNextButton = useMemo(() => {
        if (!currentSession) return false;
        // Show next button on framework selection screen if a report already exists for that session
        if (currentSession.status === AppStatus.AwaitingFrameworkSelection) {
            return !!(currentSession.results && (currentSession.results.overallSummary || (currentSession.results.analysis && currentSession.results.analysis.length > 0)));
        }
        return false;
    }, [currentSession]);


    const renderContent = () => {
        if (!currentSession) {
             return <StatusDisplay status={AppStatus.Idle} error={null} />;
        }

        const { status, error, frameworks, selectedFramework, results } = currentSession;

        switch (status) {
            case AppStatus.Idle:
                // This is now handled by the new centered layout, but we keep it here as a fallback.
                return <StatusDisplay status={status} error={error} />;
            case AppStatus.LoadingReport:
            case AppStatus.LoadingMetadata:
                return <StatusDisplay status={status} error={error} />;
            case AppStatus.AwaitingGoalInput:
                 return <GoalForm 
                            onSubmit={handleGoalSubmit} 
                            onCancel={handleNewResearch}
                            initialObjective={currentSession.objective}
                            initialScope={currentSession.scope}
                        />;
            case AppStatus.LoadingFrameworks:
                 return <StatusDisplay status={status} error={error} />;
            case AppStatus.Error:
                return <StatusDisplay status={status} error={error} />;
            case AppStatus.AwaitingFrameworkSelection:
                return <FrameworkSelector 
                            frameworks={frameworks} 
                            onSelect={handleFrameworkSelect} 
                            onRegenerate={handleRegenerateFrameworks}
                            selectedFramework={selectedFramework}
                        />;
            case AppStatus.Generating:
            case AppStatus.Success:
                return <ResultsDisplay results={results} status={status} />;
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-morandi-bg text-morandi-text-primary font-sans flex relative">
            <HistorySidebar 
                sessions={sessions}
                currentSessionId={currentSessionId}
                onSelectSession={handleSelectSession}
                onNewResearch={handleNewResearch}
                onDeleteSession={handleDeleteSession}
                onRenameSession={handleRenameSession}
                isOpen={isSidebarOpen}
                onToggle={toggleSidebar}
            />
             {!isSidebarOpen && (
                <button 
                    onClick={toggleSidebar} 
                    className="fixed top-3 left-3 z-20 p-2 bg-morandi-surface rounded-full shadow-lg border border-morandi-border hover:bg-gray-100 transition-all text-morandi-text-secondary hover:text-morandi-accent"
                    aria-label="Open sidebar"
                    title="Open sidebar"
                >
                    <ExpandSidebarIcon />
                </button>
            )}
            <div className="flex-grow flex flex-col h-screen overflow-y-auto">
                 {/* Conditional Layout */}
                 {currentSession?.status === AppStatus.Idle ? (
                    <>
                        {/* Centered "Grok-style" Welcome Screen */}
                        <main className="flex-grow flex flex-col justify-center items-center px-4 pb-20">
                            <div className="w-full max-w-3xl text-center">
                                <h1 className="text-4xl md:text-5xl font-bold text-morandi-accent">
                                    AI Research Report Aggregator
                                </h1>
                                <p className="text-morandi-text-secondary mt-4 text-lg max-w-2xl mx-auto">
                                    An AI-powered tool to synthesize research reports on any topic.
                                </p>
                                <div className="mt-10">
                                    <SearchBar
                                        topic={inputTopic}
                                        setTopic={setInputTopic}
                                        onSearch={handleSearch}
                                        onStop={handleStopOrCancel}
                                        status={currentSession?.status || AppStatus.Idle}
                                    />
                                </div>
                            </div>
                        </main>
                        <footer className="w-full text-center p-4 text-morandi-text-secondary text-sm">
                            <p>Powered by Google Gemini. For research and informational purposes only.</p>
                        </footer>
                    </>
                ) : (
                    <>
                        {/* Standard App View for active states */}
                        <Header />
                        <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8 flex-grow">
                            <SearchBar 
                                topic={inputTopic}
                                setTopic={setInputTopic}
                                onSearch={handleSearch}
                                onStop={handleStopOrCancel}
                                status={currentSession?.status || AppStatus.Idle}
                            />
                            <div className="mt-8">
                                {renderContent()}
                            </div>
                        </main>
                        <footer className="w-full">
                            <Navigation 
                                status={currentSession?.status || AppStatus.Idle} 
                                onBack={handleBack}
                                onNext={handleNext}
                                showNext={showNextButton}
                            />
                            <div className="text-center p-4 text-morandi-text-secondary text-sm">
                                <p>Powered by Google Gemini. For research and informational purposes only.</p>
                            </div>
                        </footer>
                    </>
                )}
            </div>
        </div>
    );
};

export default App;
