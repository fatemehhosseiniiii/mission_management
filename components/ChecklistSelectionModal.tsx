import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { MISSION_CHECKLISTS } from '../constants';
import Input from './ui/Input';

interface ChecklistSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (selected: Record<string, string[]>) => void;
    initialSelected: Record<string, string[]>;
}

const AccordionItem: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b last:border-b-0">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full p-4 font-medium text-right text-gray-700 hover:bg-gray-100 focus:outline-none"
            >
                <span>{title}</span>
                <svg className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 9l-7 7-7-7"></path></svg>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="p-4 bg-gray-50">
                    {children}
                </div>
            </div>
        </div>
    );
};

const StepsSelection: React.FC<{
    category: string;
    steps: string[];
    selectedItems: Record<string, string[]>;
    onToggle: (category: string, step: string) => void;
    onSelectAll: (category: string, steps: string[]) => void;
}> = ({ category, steps, selectedItems, onToggle, onSelectAll }) => {
    return (
        <div className="space-y-3">
            <button
                type="button"
                onClick={() => onSelectAll(category, steps)}
                className="text-sm font-medium text-blue-600 hover:underline"
            >
                انتخاب/لغو همه
            </button>
            {steps.map(step => (
                <label key={step} className="flex items-center space-x-3 space-x-reverse text-sm cursor-pointer">
                    <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        checked={(selectedItems[category] || []).includes(step)}
                        onChange={() => onToggle(category, step)}
                    />
                    <span className="text-gray-700">{step}</span>
                </label>
            ))}
        </div>
    );
};

const DynamicStepsInput: React.FC<{
    category: string;
    onStepsChange: (category: string, steps: string[]) => void;
    initialSteps: string[];
}> = ({ category, onStepsChange, initialSteps }) => {
    const [steps, setSteps] = useState(initialSteps || []);
    const [newStepText, setNewStepText] = useState('');

    useEffect(() => {
        onStepsChange(category, steps);
    }, [steps, category, onStepsChange]);
    
    const handleAddStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (newStepText.trim() && !steps.includes(newStepText.trim())) {
            setSteps(prev => [...prev, newStepText.trim()]);
            setNewStepText('');
        }
    };
    
    const handleRemoveStep = (stepToRemove: string) => {
        setSteps(prev => prev.filter(step => step !== stepToRemove));
    };
    
    return (
        <div className="space-y-4">
            <form onSubmit={handleAddStep} className="flex items-start sm:items-center gap-2 flex-col sm:flex-row">
                <div className="w-full sm:flex-grow">
                    <Input 
                        label=""
                        id={`dynamic-step-${category}`}
                        value={newStepText}
                        onChange={(e) => setNewStepText(e.target.value)}
                        placeholder="مرحله جدید را وارد کنید..."
                        className="w-full"
                    />
                </div>
                <Button type="submit" variant="primary" className="w-full sm:w-auto shrink-0">افزودن</Button>
            </form>
            {steps.length > 0 ? (
                <ul className="space-y-2 pt-2 border-t">
                    {steps.map(step => (
                        <li key={step} className="flex items-center justify-between p-2 bg-gray-100 rounded-md text-sm">
                            <span className="break-all">{step}</span>
                            <button type="button" onClick={() => handleRemoveStep(step)} className="text-red-500 hover:text-red-700 shrink-0 mr-2">
                                حذف
                            </button>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-sm text-gray-500 pt-2">هنوز مرحله‌ای اضافه نشده است.</p>
            )}
        </div>
    );
};


const ChecklistSelectionModal: React.FC<ChecklistSelectionModalProps> = ({ isOpen, onClose, onSave, initialSelected }) => {
    const [selectedItems, setSelectedItems] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (isOpen) {
            setSelectedItems(initialSelected || {});
        }
    }, [isOpen, initialSelected]);

    const handleToggle = (category: string, step: string) => {
        const currentCategorySteps = selectedItems[category] || [];
        const isSelected = currentCategorySteps.includes(step);
        
        let newCategorySteps;
        if (isSelected) {
            newCategorySteps = currentCategorySteps.filter(s => s !== step);
        } else {
            newCategorySteps = [...currentCategorySteps, step];
        }

        setSelectedItems(prev => ({
            ...prev,
            [category]: newCategorySteps,
        }));
    };
    
    const handleSelectAll = (category: string, steps: string[]) => {
        const areAllSelected = (selectedItems[category] || []).length === steps.length;
        if(areAllSelected) {
            setSelectedItems(prev => ({ ...prev, [category]: [] }));
        } else {
            setSelectedItems(prev => ({ ...prev, [category]: steps }));
        }
    };

    const handleSave = () => {
        onSave(selectedItems);
    };

    const footer = (
        <div className="flex space-x-3 space-x-reverse">
            <Button variant="secondary" onClick={onClose}>لغو</Button>
            <Button onClick={handleSave}>ذخیره مراحل</Button>
        </div>
    );
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="انتخاب مراحل ماموریت" footer={footer}>
            <div className="border rounded-md">
                {MISSION_CHECKLISTS.map((item: any) => {
                    // Render nested accordion for items with subcategories
                    if (item.subcategories && Array.isArray(item.subcategories)) {
                        return (
                            <AccordionItem key={item.category} title={item.category}>
                                <div className="-m-4">
                                    {item.subcategories.map((subItem: any) => {
                                        const fullCategoryName = `${item.category} - ${subItem.category}`;
                                        return (
                                            <AccordionItem key={fullCategoryName} title={subItem.category}>
                                                <StepsSelection
                                                    category={fullCategoryName}
                                                    steps={subItem.steps}
                                                    selectedItems={selectedItems}
                                                    onToggle={handleToggle}
                                                    onSelectAll={handleSelectAll}
                                                />
                                            </AccordionItem>
                                        );
                                    })}
                                </div>
                            </AccordionItem>
                        );
                    }

                    if (item.isDynamic) {
                         return (
                            <AccordionItem key={item.category} title={item.category}>
                                <DynamicStepsInput
                                    category={item.category}
                                    initialSteps={selectedItems[item.category] || []}
                                    onStepsChange={(cat, steps) => {
                                        setSelectedItems(prev => ({ ...prev, [cat]: steps }));
                                    }}
                                />
                            </AccordionItem>
                        );
                    }
                    
                    if (item.steps && item.steps.length > 0) {
                        return (
                            <AccordionItem key={item.category} title={item.category}>
                                 <StepsSelection
                                    category={item.category}
                                    steps={item.steps}
                                    selectedItems={selectedItems}
                                    onToggle={handleToggle}
                                    onSelectAll={handleSelectAll}
                                />
                            </AccordionItem>
                        );
                    }

                    return null;
                })}
            </div>
        </Modal>
    );
};

export default ChecklistSelectionModal;