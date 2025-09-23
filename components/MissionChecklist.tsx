import React from 'react';
import { ChecklistItem, ChecklistState } from '../types';

interface MissionChecklistProps {
    checklist: ChecklistItem[];
    checklistState: ChecklistState;
    onStateChange: (newState: ChecklistState) => void;
    isReadOnly?: boolean;
}

const MissionChecklist: React.FC<MissionChecklistProps> = ({ checklist, checklistState, onStateChange, isReadOnly = false }) => {
    
    const handleToggle = (category: string, step: string) => {
        if (isReadOnly) return;

        const newChecklistState = JSON.parse(JSON.stringify(checklistState)); // Deep copy

        if (!newChecklistState[category]) {
            newChecklistState[category] = {};
        }

        newChecklistState[category][step] = !newChecklistState[category][step];
        onStateChange(newChecklistState);
    };
    
    if (!checklist || checklist.length === 0) {
        return <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-md text-center">چک‌لیستی برای این ماموریت تعریف نشده است.</p>;
    }

    return (
        <div className="space-y-4 pt-2">
            {checklist.map(({ category, steps }) => (
                <div key={category}>
                    <h5 className="font-semibold text-gray-800">{category}</h5>
                    <div className="mt-2 space-y-2 ps-2">
                        {steps.map(step => {
                            const isChecked = checklistState[category] ? checklistState[category][step] || false : false;
                            return (
                                <label key={step} className={`flex items-center space-x-3 space-x-reverse text-sm ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                                    <input
                                        type="checkbox"
                                        className={`h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                                        checked={isChecked}
                                        onChange={() => handleToggle(category, step)}
                                        disabled={isReadOnly}
                                    />
                                    <span className={`text-gray-700 ${isChecked && !isReadOnly ? 'line-through text-gray-500' : ''}`}>
                                        {step}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MissionChecklist;
