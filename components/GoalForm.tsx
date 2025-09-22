import React, { useState } from 'react';

interface GoalFormProps {
    onSubmit: (data: { objective: string; scope: string }) => void;
    onCancel: () => void;
    initialObjective: string;
    initialScope: string;
}

const GoalForm: React.FC<GoalFormProps> = ({ onSubmit, onCancel, initialObjective, initialScope }) => {
    const [objective, setObjective] = useState(initialObjective || '');
    const [scope, setScope] = useState(initialScope || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (objective.trim()) {
            onSubmit({ objective, scope });
        }
    };

    return (
        <div className="p-6 bg-morandi-surface/50 border border-morandi-border rounded-lg shadow-sm animate-fade-in">
            <h2 className="text-xl font-bold text-morandi-accent mb-4 text-center">
                Define Your Research Goals
            </h2>
            <p className="text-morandi-text-secondary text-center mb-6">
                To provide the best analysis, please specify your research objective and scope.
            </p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="objective" className="block text-sm font-medium text-morandi-text-primary mb-2">
                        Research Objective <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="objective"
                        rows={3}
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="e.g., Identify investment opportunities, understand the competitive landscape, or assess market entry risks."
                        className="w-full p-3 bg-morandi-surface border border-morandi-border rounded-lg text-morandi-text-primary placeholder-morandi-text-secondary focus:outline-none focus:ring-2 focus:ring-morandi-accent transition-colors"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="scope" className="block text-sm font-medium text-morandi-text-primary mb-2">
                        Scope (Optional)
                    </label>
                    <textarea
                        id="scope"
                        rows={2}
                        value={scope}
                        onChange={(e) => setScope(e.target.value)}
                        placeholder="e.g., Focus on the U.S. market, analyze trends from the last 3 years, or exclude early-stage startups."
                        className="w-full p-3 bg-morandi-surface border border-morandi-border rounded-lg text-morandi-text-primary placeholder-morandi-text-secondary focus:outline-none focus:ring-2 focus:ring-morandi-accent transition-colors"
                    />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                     <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 text-morandi-text-secondary font-semibold rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-morandi-accent disabled:opacity-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!objective.trim()}
                        className="px-6 py-2 bg-morandi-accent text-white font-semibold rounded-lg hover:bg-morandi-accent-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-morandi-surface focus:ring-morandi-accent disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        Suggest Frameworks
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GoalForm;