
import React, { useState, useMemo, useEffect } from 'react';
import { useUI } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { useMissions } from '../contexts/MissionContext';
import { Role } from '../types';
import Modal from './ui/Modal';
import Select from './ui/Select';
import Button from './ui/Button';
import Textarea from './ui/Textarea';
import { useToast } from '../contexts/ToastContext';

const DelegateMissionModal: React.FC = () => {
    const { isDelegateModalOpen, closeDelegateModal, missionToDelegate } = useUI();
    const { user: currentUser, users } = useAuth();
    const { initiateDelegation } = useMissions();
    const { addToast } = useToast();
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [reason, setReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const delegatableUsers = useMemo(() => {
        if (!currentUser || !missionToDelegate) return [];
        return users.filter(u => 
            u.role === Role.EMPLOYEE && 
            u.id !== currentUser.id
        );
    }, [users, currentUser, missionToDelegate]);

    useEffect(() => {
      if (isDelegateModalOpen) {
        setSelectedUserId('');
        setReason('');
      }
    }, [isDelegateModalOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (missionToDelegate && selectedUserId && reason && currentUser) {
            setIsSubmitting(true);
            try {
                await initiateDelegation(missionToDelegate.id, selectedUserId, reason);
                addToast('درخواست ارجاع ماموریت با موفقیت ارسال شد.', 'success');
                handleClose();
            } catch (error) {
                addToast("خطا در ارسال درخواست ارجاع.", 'error');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleClose = () => {
        setSelectedUserId('');
        setReason('');
        closeDelegateModal();
    };

    if (!missionToDelegate) return null;
    
    const footer = (
        <div className="flex space-x-3 space-x-reverse">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                لغو
            </Button>
            <Button form="delegate-form" type="submit" disabled={!selectedUserId || !reason || delegatableUsers.length === 0 || isSubmitting}>
                {isSubmitting ? 'در حال ارسال...' : 'ارسال درخواست'}
            </Button>
        </div>
    );

    return (
        <Modal
            isOpen={isDelegateModalOpen}
            onClose={handleClose}
            title="ارجاع ماموریت"
            footer={footer}
        >
            <form id="delegate-form" onSubmit={handleSubmit} className="space-y-6">
                <p className="text-sm text-gray-600">
                    ماموریت <span className="font-semibold text-gray-800">"{missionToDelegate.subject}"</span> را به کدام کاربر ارجاع می‌دهید؟
                </p>
                <Select
                    label="کاربر جدید"
                    id="delegateUser"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                >
                    <option value="" disabled>یک کاربر را انتخاب کنید</option>
                    {delegatableUsers.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name} - {user.department}
                        </option>
                    ))}
                </Select>

                 <Textarea
                    label="علت ارجاع"
                    id="delegationReason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                    placeholder="لطفا دلیل ارجاع این ماموریت را به صورت خلاصه بنویسید..."
                />

                {delegatableUsers.length === 0 && (
                    <p className="text-sm text-yellow-700 text-center p-3 bg-yellow-100 rounded-md">
                        کاربر دیگری برای ارجاع ماموریت وجود ندارد.
                    </p>
                )}
            </form>
        </Modal>
    );
};

export default DelegateMissionModal;
