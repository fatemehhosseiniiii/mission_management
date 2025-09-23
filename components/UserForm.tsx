
import React, { useState, useEffect } from 'react';
import { useUI } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { Department, User, NewUserData } from '../types';
import { DEPARTMENTS } from '../constants';
import Modal from './ui/Modal';
import Input from './ui/Input';
import Select from './ui/Select';
import Button from './ui/Button';
import { useToast } from '../contexts/ToastContext';

interface UserFormProps {
    userToEdit: User | null;
}

const initialFormState: NewUserData = {
    name: '',
    password: '',
    department: Department.SALES,
    phone: '',
};

const UserForm: React.FC<UserFormProps> = ({ userToEdit }) => {
    const { isUserModalOpen, closeUserModal } = useUI();
    const { addUser, updateUser, user: currentUser } = useAuth();
    const { addToast } = useToast();
    const [formData, setFormData] = useState<NewUserData>(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEditMode = !!userToEdit;
    const isEditingSelf = isEditMode && userToEdit?.id === currentUser?.id;

    useEffect(() => {
        if (isUserModalOpen) {
            if (isEditMode && userToEdit) {
                setFormData({
                    name: userToEdit.name,
                    password: userToEdit.password,
                    department: userToEdit.department,
                    phone: userToEdit.phone,
                });
            } else {
                setFormData(initialFormState);
            }
        }
    }, [isUserModalOpen, userToEdit, isEditMode]);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value as Department }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (isEditMode && userToEdit) {
                 const updatedUserData: Partial<NewUserData> = {
                    name: formData.name,
                    department: formData.department,
                    phone: formData.phone,
                    password: formData.password,
                };
                await updateUser(userToEdit.id, updatedUserData);
                addToast('اطلاعات کاربر با موفقیت به‌روزرسانی شد.', 'success');
            } else {
                await addUser(formData);
                addToast('کاربر جدید با موفقیت ثبت شد.', 'success');
            }
            handleClose();
        } catch (error) {
            addToast("خطا در ذخیره اطلاعات کاربر.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setFormData(initialFormState);
        closeUserModal();
    };
    
    const footer = (
         <div className="flex space-x-3 space-x-reverse">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting}>
                لغو
            </Button>
            <Button type="submit" form="user-form" disabled={isSubmitting}>
                {isSubmitting ? 'در حال ذخیره...' : (isEditMode ? 'ذخیره تغییرات' : 'ثبت کاربر')}
            </Button>
        </div>
    );

    const modalTitle = isEditingSelf ? "اطلاعات من" : (isEditMode ? "ویرایش کاربر" : "ثبت کاربر جدید");

    return (
        <Modal isOpen={isUserModalOpen} onClose={handleClose} title={modalTitle} footer={footer}>
            <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                        label="نام کاربر" 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                    />
                    <Input 
                        label="رمز ورود کاربر" 
                        id="password" 
                        name="password"
                        type={isEditMode ? "text" : "password"}
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                     <Input 
                        label="شماره موبایل" 
                        id="phone" 
                        name="phone"
                        type="tel"
                        value={formData.phone} 
                        onChange={handleChange} 
                        required 
                    />
                    <Select 
                        label="واحد" 
                        id="department" 
                        name="department" 
                        value={formData.department} 
                        onChange={handleChange} 
                        required
                        disabled={isEditingSelf}
                    >
                        {isEditingSelf ? (
                            <option value={Department.MANAGEMENT}>{Department.MANAGEMENT}</option>
                        ) : (
                            DEPARTMENTS.filter(d => d !== Department.MANAGEMENT).map(dep => (
                                <option key={dep} value={dep}>{dep}</option>
                            ))
                        )}
                    </Select>
                </div>
            </form>
        </Modal>
    );
};

export default UserForm;
