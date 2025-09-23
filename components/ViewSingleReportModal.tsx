import React, { useState, useEffect } from 'react';
import { useUI } from '../App';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { useAuth } from '../contexts/AuthContext';
import jalaali from 'jalaali-js';

const toPersianDigits = (str: string | number): string => {
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(str).replace(/\d/g, (d) => persianDigits[parseInt(d)]);
};

const formatReportDateTime = (isoString: string): string => {
    if (!isoString || isNaN(new Date(isoString).getTime())) return '-';
    const date = new Date(isoString);
    const { jy, jm, jd } = jalaali.toJalaali(date);
    const time = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const shamsiDate = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
    return toPersianDigits(`${shamsiDate} ${time}`);
};


const ViewSingleReportModal: React.FC = () => {
    const { isViewSingleReportModalOpen, closeViewSingleReportModal, reportForModal } = useUI();
    const { findUserById } = useAuth();
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (reportForModal?.mission?.checklist) {
            const initialOpenState = reportForModal.mission.checklist.reduce((acc, item) => {
                acc[item.category] = true; // Default to open
                return acc;
            }, {} as Record<string, boolean>);
            setOpenCategories(initialOpenState);
        }
    }, [reportForModal]);


    if (!isViewSingleReportModalOpen || !reportForModal) {
        return null;
    }

    const { mission, report } = reportForModal;
    const reporter = findUserById(report.reporterId);
    
    const toggleCategory = (category: string) => {
        setOpenCategories(prev => ({ ...prev, [category]: !prev[category] }));
    };

    const createdAt = formatReportDateTime(report.createdAt);
    const departureAt = formatReportDateTime(report.departureTime);
    const returnAt = formatReportDateTime(report.returnTime);

    const footer = (
        <div className="flex justify-start w-full">
            <Button type="button" variant="secondary" onClick={closeViewSingleReportModal}>
                بازگشت به فرم
            </Button>
        </div>
    );

    const modalTitle = `مشاهده گزارش ${reporter?.name || 'ناشناس'}`;

    return (
        <Modal
            isOpen={isViewSingleReportModalOpen}
            onClose={closeViewSingleReportModal}
            title={modalTitle}
            footer={footer}
        >
            <div className="space-y-6 text-gray-800">
                {/* Top Info Block */}
                <div className="space-y-3 text-sm">
                    <div className="pb-3 border-b border-gray-200">
                        <p className="font-semibold">گزارش ثبت شده توسط {reporter?.name || 'ناشناس'}</p>
                        <p className="text-gray-500 text-xs mt-1">{createdAt}</p>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                        <span className="font-semibold">تاریخ و ساعت خروج:</span>
                        <span>{departureAt}</span>
                      
                    </div>
                    <div className="flex justify-between items-center pt-1 pb-2">
                          <span className="font-semibold">تاریخ و ساعت بازگشت:</span>
                        <span>{returnAt}</span>
                    </div>
                </div>

                {/* Accordion Block */}
                {mission.checklist && mission.checklist.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">وضعیت مراحل در این گزارش</h3>
                        <div className="border rounded-lg overflow-hidden shadow-sm bg-white">
                            {mission.checklist.map(item => (
                                <div key={item.category} className="border-b last:border-b-0">
                                    <button
                                        onClick={() => toggleCategory(item.category)}
                                        className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 focus:outline-none"
                                        aria-expanded={openCategories[item.category]}
                                    >
                                        <span className="font-semibold">{item.category}</span>
                                        <svg className={`w-5 h-5 transition-transform duration-200 text-gray-500 ${openCategories[item.category] ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </button>
                                    <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openCategories[item.category] ? 'max-h-96' : 'max-h-0'}`}>
                                        <div className="p-4">
                                            <div className="space-y-3">
                                                {item.steps.map(step => {
                                                    const isChecked = report.checklistSnapshot[item.category]?.[step] || false;
                                                    return (
                                                        <div key={step} className="flex items-center space-x-3 space-x-reverse text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                readOnly
                                                                className="h-5 w-5 rounded border-gray-400 text-gray-600 focus:ring-transparent ring-offset-0 cursor-default"
                                                                style={{ accentColor: '#a0aec0' }}
                                                            />
                                                            <span className="text-gray-700">{step}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Summary Block */}
                <div>
                    <label htmlFor="report-summary-view" className="block text-base font-semibold text-gray-800 mb-2">شرح گزارش:</label>
                    <div id="report-summary-view" className="w-full p-3 bg-gray-50 border border-gray-200 rounded-md min-h-[80px] text-sm text-gray-700 whitespace-pre-wrap">
                        {report.summary || <span className="text-gray-400 italic">شرحی ثبت نشده است.</span>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ViewSingleReportModal;