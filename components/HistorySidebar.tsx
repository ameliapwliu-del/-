import React, { useState, useEffect } from 'react';
import { ResearchSession } from '../types';

interface HistorySidebarProps {
    sessions: ResearchSession[];
    currentSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewResearch: () => void;
    onDeleteSession: (sessionId: string) => void;
    onRenameSession: (sessionId: string, newTopic: string) => void;
    isOpen: boolean;
    onToggle: () => void;
}

const NewResearchIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
);

const CollapseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
    </svg>
);

const EditIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
        <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const DeleteIcon: React.FC = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
    </svg>
);

const HistorySidebar: React.FC<HistorySidebarProps> = ({ sessions, currentSessionId, onSelectSession, onNewResearch, onDeleteSession, onRenameSession, isOpen, onToggle }) => {
    const sortedSessions = [...sessions].sort((a, b) => b.createdAt - a.createdAt);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        if (editingId) {
            const session = sessions.find(s => s.id === editingId);
            if (session) {
                setEditText(session.topic);
            }
        }
    }, [editingId, sessions]);

    const handleRename = () => {
        if (editingId && editText.trim()) {
            onRenameSession(editingId, editText.trim());
        }
        setEditingId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRename();
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    const handleDelete = (e: React.MouseEvent, sessionId: string, sessionTopic: string) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${sessionTopic}"?`)) {
            onDeleteSession(sessionId);
        }
    };
    
    const handleEditClick = (e: React.MouseEvent, session: ResearchSession) => {
        e.stopPropagation();
        setEditingId(session.id);
        setEditText(session.topic);
    }

    return (
        <aside className={`flex-shrink-0 bg-morandi-surface/50 border-r border-morandi-border flex flex-col h-screen sticky top-0 transition-all duration-300 ease-in-out z-10 ${isOpen ? 'w-64 p-2' : 'w-0 p-0 overflow-hidden'}`}>
            <div className="w-[240px] flex flex-col h-full">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                    <button
                        onClick={onNewResearch}
                        className="flex items-center justify-center w-full px-4 py-3 text-morandi-text-primary font-semibold bg-morandi-surface rounded-lg border border-morandi-border hover:bg-morandi-accent/10 hover:border-morandi-accent transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-morandi-accent"
                    >
                        <NewResearchIcon />
                        <span className="ml-2">New Research</span>
                    </button>
                    <button 
                        onClick={onToggle} 
                        className="ml-2 p-2 text-morandi-text-secondary hover:text-morandi-accent hover:bg-gray-200 rounded-full transition-colors"
                        aria-label="Collapse sidebar"
                        title="Collapse sidebar"
                    >
                        <CollapseIcon />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto">
                    <nav className="space-y-1">
                        {sortedSessions.map((session) => (
                           (session.topic || editingId === session.id) && (
                                <div
                                    key={session.id}
                                    className={`group relative w-full rounded-md ${currentSessionId === session.id && editingId !== session.id ? 'bg-morandi-accent/20' : ''}`}
                                >
                                    {editingId === session.id ? (
                                        <input
                                            type="text"
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            onBlur={handleRename}
                                            onKeyDown={handleKeyDown}
                                            className="w-full text-left px-3 py-2 rounded-md text-sm bg-white border border-morandi-accent ring-2 ring-morandi-accent outline-none"
                                            autoFocus
                                        />
                                    ) : (
                                        <button
                                            onClick={() => onSelectSession(session.id)}
                                            className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors ${
                                                currentSessionId === session.id
                                                    ? 'text-morandi-accent font-semibold'
                                                    : 'text-morandi-text-secondary hover:bg-gray-200 hover:text-morandi-text-primary'
                                            }`}
                                            title={session.topic}
                                        >
                                            {session.topic}
                                        </button>
                                    )}

                                    {editingId !== session.id && (
                                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                            <button onClick={(e) => handleEditClick(e, session)} className="p-1 rounded text-morandi-text-secondary hover:bg-gray-300 hover:text-morandi-accent" title="Rename">
                                                <EditIcon />
                                            </button>
                                            <button onClick={(e) => handleDelete(e, session.id, session.topic)} className="p-1 rounded text-morandi-text-secondary hover:bg-gray-300 hover:text-morandi-stop" title="Delete">
                                                <DeleteIcon />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        ))}
                    </nav>
                </div>
            </div>
        </aside>
    );
};

export default HistorySidebar;