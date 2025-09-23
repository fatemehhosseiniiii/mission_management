import React, { useState, useEffect } from 'react';
import { Mission, Role, MissionStatus, ChecklistItem, ChecklistState, MissionReport, ModalView } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useMissions } from '../contexts/MissionContext';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import Select from './ui/Select';
import Textarea from './ui/Textarea';
import { useToast } from '../contexts/ToastContext';
import ChecklistSelectionModal from './ChecklistSelectionModal';
import PersianDateTimePicker from './ui/PersianDateTimePicker';
import MissionChecklist from './MissionChecklist';
import MissionReportView from './MissionReportView';
import { useUI } from '../App';
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


const initialCreateState = {
    subject: '',
    location: '',
    starttime: '',
    endtime: '',
    assignedto: '',
};

const initialReportState = {
    departureTime: '',
    returnTime: '',
    summary: '',
};

interface MissionFormProps {
    isOpen: boolean;
    onClose: () => void;
    mission: Mission | null;
    modalView: ModalView;
}

const MissionForm: React.FC<MissionFormProps> = ({ isOpen, onClose, mission, modalView }) => {
    const { user: currentUser, users, findUserById } = useAuth();
    const { addMission, updateMission } = useMissions();
    const { addToast } = useToast();
    const { openViewSingleReportModal } = useUI();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [createData, setCreateData] = useState(initialCreateState);
    const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem[]>([]);
    
    const [reportData, setReportData] = useState(initialReportState);
    const [checklistState, setChecklistState] = useState<ChecklistState>({});
    const [reportStatus, setReportStatus] = useState<MissionStatus>(MissionStatus.IN_PROGRESS);


    const employeeUsers = users.filter(u => u.role === Role.EMPLOYEE);

    useEffect(() => {
        if (isOpen) {
            if (modalView === 'CREATE') {
                setCreateData(initialCreateState);
                setSelectedChecklist([]);
            } else if (mission) {
                const isDelegatedToCurrentUser = mission.delegated_by && currentUser?.id === mission.assignedto;
                const isEditingOwnReport = !mission.delegated_by && currentUser?.id === mission.assignedto;
                const existingReport = mission.reports?.[0];

                if (isEditingOwnReport && mission.status === MissionStatus.IN_PROGRESS && existingReport) {
                    // Scenario: Editing your own non-delegated report
                    setReportData({
                        departureTime: existingReport.departureTime,
                        returnTime: existingReport.returnTime,
                        summary: existingReport.summary,
                    });
                    setChecklistState(mission.checkliststate || {});
                } else {
                    // Scenario: Starting a new report (either first time, or after delegation)
                    setReportData(initialReportState);
                    setChecklistState({}); 
                }
                
                // Always set the status dropdown based on the mission's current status
                setReportStatus(mission.status === MissionStatus.COMPLETED ? MissionStatus.COMPLETED : MissionStatus.IN_PROGRESS);
            }
        } else {
            // Reset state on close
            setCreateData(initialCreateState);
            setSelectedChecklist([]);
            setReportData(initialReportState);
            setChecklistState({});
            setReportStatus(MissionStatus.IN_PROGRESS);
        }
    }, [isOpen, modalView, mission, currentUser]);


    const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setCreateData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleChecklistSave = (selected: Record<string, string[]>) => {
        const newChecklist: ChecklistItem[] = Object.entries(selected)
            .map(([category, steps]) => ({ category, steps }));
        setSelectedChecklist(newChecklist);
        setIsChecklistModalOpen(false);
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addMission({
                ...createData,
                checklist: selectedChecklist,
            });
            addToast('ماموریت جدید با موفقیت ثبت شد.', 'success');
            handleClose();
        } catch (error) {
            addToast('خطا در ثبت ماموریت.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleReportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mission || !currentUser) return;

        setIsSubmitting(true);
        try {
            const isDelegatedToCurrentUser = mission.delegated_by && currentUser?.id === mission.assignedto;

            if (isDelegatedToCurrentUser) {
                // --- Logic to ADD a new report for a delegated mission ---
                const newReport: MissionReport = {
                    id: `R${Date.now()}`,
                    reporterId: currentUser.id,
                    createdAt: new Date().toISOString(),
                    departureTime: reportData.departureTime,
                    returnTime: reportData.returnTime,
                    summary: reportData.summary,
                    checklistSnapshot: checklistState,
                };
                 const mergedChecklistState = { ...mission.checkliststate };
                 for (const category in checklistState) {
                     if (!mergedChecklistState[category]) mergedChecklistState[category] = {};
                     for (const step in checklistState[category]) {
                         if (checklistState[category][step]) {
                             mergedChecklistState[category][step] = true;
                         }
                     }
                 }
                const updatedMission: Mission = {
                    ...mission,
                    status: reportStatus,
                    reports: [...mission.reports, newReport],
                    checkliststate: mergedChecklistState,
                };
                await updateMission(updatedMission);

            } else {
                // --- Logic to UPDATE a single report for a non-delegated mission ---
                const existingReport = mission.reports?.[0];
                let newOrUpdatedReport: MissionReport;

                if (existingReport) {
                    newOrUpdatedReport = { ...existingReport, departureTime: reportData.departureTime, returnTime: reportData.returnTime, summary: reportData.summary, checklistSnapshot: checklistState };
                } else {
                    newOrUpdatedReport = { id: `R${Date.now()}`, reporterId: currentUser.id, createdAt: new Date().toISOString(), departureTime: reportData.departureTime, returnTime: reportData.returnTime, summary: reportData.summary, checklistSnapshot: checklistState };
                }
                const updatedMission: Mission = { ...mission, status: reportStatus, reports: [newOrUpdatedReport], checkliststate: checklistState };
                await updateMission(updatedMission);
            }
            
            addToast('گزارش با موفقیت ثبت شد.', 'success');
            handleClose();
        } catch (error) {
            addToast('خطا در ثبت گزارش.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleClose = () => {
        onClose();
    };

    const renderCreateForm = () => (
         <form id="mission-create-form" onSubmit={handleCreateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="موضوع ماموریت" name="subject" value={createData.subject} onChange={handleCreateChange} required />
                <Input label="محل ماموریت" name="location" value={createData.location} onChange={handleCreateChange} required />
                <PersianDateTimePicker label="زمان شروع" value={createData.starttime} onChange={(val) => setCreateData(p => ({...p, starttime: val}))} required />
                <PersianDateTimePicker label="زمان پایان" value={createData.endtime} onChange={(val) => setCreateData(p => ({...p, endtime: val}))} required />
                <Select label="مسئول انجام" name="assignedto" value={createData.assignedto} onChange={handleCreateChange} required>
                    <option value="" disabled>یک کارمند را انتخاب کنید</option>
                    {employeeUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
                <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">چک‌لیست (اختیاری)</label>
                     <Button type="button" variant="secondary" onClick={() => setIsChecklistModalOpen(true)}>
                         انتخاب مراحل چک‌لیست ({selectedChecklist.length} دسته)
                     </Button>
                </div>
            </div>
        </form>
    );

    const renderFullView = () => {
        if (!mission) return null;
        const isMissionAssignedToCurrentUser = currentUser?.id === mission.assignedto;
        const isDelegatedToCurrentUser = mission.delegated_by && isMissionAssignedToCurrentUser;

        return (
             <div className="space-y-6">
                <MissionReportView mission={mission} />
                
                {isDelegatedToCurrentUser && (
                     <fieldset className="px-4 pt-2 pb-4 border rounded-md">
                        <legend className="text-lg font-semibold px-2 text-gray-700">گزارش‌های ثبت شده</legend>
                        {mission.reports.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">گزارشی برای این ماموریت ثبت نشده است.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                               {mission.reports.map((report, index) => (
                                   <li key={report.id} className="py-3 flex justify-between items-center">
                                       <div>
                                           <p className="font-semibold text-gray-800">
                                                گزارش شماره {toPersianDigits(index + 1)}
                                                <span className="text-sm font-normal text-gray-500 mr-2">
                                                    (ثبت توسط: {findUserById(report.reporterId)?.name || 'ناشناس'})
                                                </span>
                                           </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                ثبت شده در: {formatReportDateTime(report.createdAt)}
                                            </p>
                                       </div>
                                        <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => openViewSingleReportModal(mission, report)}>
                                            مشاهده جزئیات
                                        </Button>
                                   </li>
                               ))}
                            </ul>
                        )}
                    </fieldset>
                )}

                {isMissionAssignedToCurrentUser && mission.status !== MissionStatus.COMPLETED && (
                     <form id="mission-report-form" onSubmit={handleReportSubmit} className="space-y-6">
                         <fieldset className="px-4 pt-2 pb-4 border rounded-md">
                            <legend className="text-lg font-semibold px-2 text-gray-700">ثبت گزارش نهایی</legend>
                            <div className="space-y-6 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <PersianDateTimePicker label="زمان خروج" value={reportData.departureTime} onChange={(val) => setReportData(p => ({...p, departureTime: val}))} required />
                                    <PersianDateTimePicker label="زمان برگشت" value={reportData.returnTime} onChange={(val) => setReportData(p => ({...p, returnTime: val}))} required />
                                </div>
                                {mission.checklist.length > 0 && (
                                     <fieldset className="px-4 pt-2 pb-4 border rounded-md bg-white">
                                        <legend className="text-md font-semibold px-2 text-gray-600">چک‌لیست انجام کار</legend>
                                        <MissionChecklist
                                            checklist={mission.checklist}
                                            checklistState={checklistState}
                                            onStateChange={setChecklistState}
                                            isReadOnly={false}
                                        />
                                    </fieldset>
                                )}
                                <div>
                                    <Select 
                                        label="وضعیت ماموریت" 
                                        id="reportStatus"
                                        value={reportStatus}
                                        onChange={(e) => setReportStatus(e.target.value as MissionStatus)}
                                        required
                                     >
                                         <option value={MissionStatus.IN_PROGRESS}>در حال انجام</option>
                                         <option value={MissionStatus.COMPLETED}>تکمیل شده</option>
                                     </Select>
                                </div>
                                <div>
                                    <Textarea 
                                        id="summary" 
                                        label="شرح گزارش" 
                                        value={reportData.summary} 
                                        onChange={(e) => setReportData(p => ({...p, summary: e.target.value}))} 
                                        required 
                                    />
                                </div>
                            </div>
                        </fieldset>
                    </form>
                )}
            </div>
        );
    };
    
    const renderReportView = () => {
         if (!mission) return null;
         return (
             <div className="space-y-6">
                <MissionReportView mission={mission} />
                <fieldset className="px-4 pt-2 pb-4 border rounded-md">
                    <legend className="text-lg font-semibold px-2 text-gray-700">گزارش‌های ثبت شده</legend>
                    {mission.reports.length === 0 ? (
                        <p className="text-center text-gray-500 py-4">گزارشی برای این ماموریت ثبت نشده است.</p>
                    ) : (
                        <ul className="divide-y divide-gray-200">
                           {mission.reports.map((report, index) => (
                               <li key={report.id} className="py-3 flex justify-between items-center">
                                   <div>
                                       <p className="font-semibold text-gray-800">
                                            گزارش شماره {toPersianDigits(index + 1)}
                                            <span className="text-sm font-normal text-gray-500 mr-2">
                                                (ثبت توسط: {findUserById(report.reporterId)?.name || 'ناشناس'})
                                            </span>
                                       </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            ثبت شده در: {formatReportDateTime(report.createdAt)}
                                        </p>
                                   </div>
                                    <Button variant="secondary" className="text-xs px-2 py-1" onClick={() => openViewSingleReportModal(mission, report)}>
                                        مشاهده جزئیات
                                    </Button>
                               </li>
                           ))}
                        </ul>
                    )}
                </fieldset>
            </div>
         );
    };

    let title, content, footer;
    switch (modalView) {
        case 'CREATE':
            title = 'ثبت ماموریت جدید';
            content = renderCreateForm();
            footer = (
                <div className="flex space-x-3 space-x-reverse">
                    <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>لغو</Button>
                    <Button type="submit" form="mission-create-form" disabled={isSubmitting}>
                        {isSubmitting ? 'در حال ثبت...' : 'ثبت ماموریت'}
                    </Button>
                </div>
            );
            break;
        case 'FULL':
            title = 'مشاهده گزارش ماموریت';
            content = renderFullView();
            footer = (
                <div className="flex space-x-3 space-x-reverse">
                    <Button type="button" variant="secondary" onClick={handleClose}>بستن</Button>
                    {currentUser?.id === mission?.assignedto && mission?.status !== MissionStatus.COMPLETED && (
                        <Button type="submit" form="mission-report-form" disabled={isSubmitting}>
                            {isSubmitting ? 'در حال ثبت...' : 'ثبت گزارش'}
                        </Button>
                    )}
                </div>
            );
            break;
        case 'VIEW_REPORT':
            title = 'مشاهده گزارش ماموریت';
            content = renderReportView();
            footer = (
                 <div className="flex justify-center w-full">
                    <Button type="button" variant="secondary" onClick={handleClose}>بستن</Button>
                 </div>
            );
            break;
        default:
            title = '';
            content = null;
            footer = null;
    }

    return (
        <>
            <Modal isOpen={isOpen} onClose={handleClose} title={title} footer={footer}>
                {content}
            </Modal>
            {modalView === 'CREATE' && (
                <ChecklistSelectionModal 
                    isOpen={isChecklistModalOpen}
                    onClose={() => setIsChecklistModalOpen(false)}
                    onSave={handleChecklistSave}
                    initialSelected={
                        selectedChecklist.reduce((acc, item) => {
                            acc[item.category] = item.steps;
                            return acc;
                        }, {} as Record<string, string[]>)
                    }
                />
            )}
        </>
    );
};

export default MissionForm;