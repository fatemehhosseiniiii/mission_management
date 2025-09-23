import React, { useState, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMissions } from '../contexts/MissionContext';
import { Role, User } from '../types';
import Button from './ui/Button';
import Modal from './ui/Modal';
import { useUI } from '../App';
import { useToast } from '../contexts/ToastContext';

const UserManagement: React.FC = () => {
    const { users, deleteUser } = useAuth();
    const { openUserModal, openPerformancePage } = useUI();
    const { deleteMissionsByUserId } = useMissions();
    const { addToast } = useToast();
    const [userToDelete, setUserToDelete] = useState<{ id: string; name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const employeeUsers = useMemo(() => users.filter(u => u.role === Role.EMPLOYEE), [users]);

    const handleConfirmDelete = async () => {
        if (userToDelete) {
            setIsDeleting(true);
            try {
                await deleteMissionsByUserId(userToDelete.id);
                await deleteUser(userToDelete.id);
                addToast(`کاربر "${userToDelete.name}" با موفقیت حذف شد.`, 'success');
                setUserToDelete(null); 
            } catch (error) {
                addToast((error as Error).message, 'error');
            } finally {
                setIsDeleting(false);
            }
        }
    };
    
    const handleCancelDelete = () => {
        setUserToDelete(null);
    };

    const handleEditUser = (user: User) => {
        openUserModal(user);
    };

    const handleShowPerformance = (user: User) => {
        openPerformancePage(user);
    };
    
    const deleteModalFooter = (
         <div className="flex space-x-3 space-x-reverse">
            <Button type="button" variant="secondary" onClick={handleCancelDelete} disabled={isDeleting}>
                خیر
            </Button>
            <Button type="button" variant="danger" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'در حال حذف...' : 'بله'}
            </Button>
        </div>
    );

    return (
        <>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">لیست کاربران</h2>
                 </div>

                 {employeeUsers.length > 0 ? (
                    <>
                        {/* Desktop: Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام کاربر</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">بخش</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">شماره تماس</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">عملیات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {employeeUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" >{user.phone}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium space-x-2 space-x-reverse">
                                                <Button variant="secondary" onClick={() => handleShowPerformance(user)} className="px-3 py-1 text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 focus:ring-sky-300">عملکرد</Button>
                                                <Button variant="secondary" onClick={() => handleEditUser(user)} className="px-3 py-1 text-xs">ویرایش</Button>
                                                <Button variant="danger" onClick={() => setUserToDelete({ id: user.id, name: user.name })} className="px-3 py-1 text-xs">حذف</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile: Card View */}
                        <div className="md:hidden space-y-4">
                            {employeeUsers.map(user => (
                                <div key={user.id} className="p-4 bg-gray-50 border rounded-lg">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-lg font-bold text-gray-900">{user.name}</p>
                                            <p className="text-sm text-gray-600">{user.department}</p>
                                        </div>
                                        <p className="text-sm text-gray-600 shrink-0 mt-2">{user.phone}</p>
                                    </div>
                                    <div className="flex items-center justify-end space-x-2 space-x-reverse pt-3 mt-3 border-t">
                                        <Button variant="secondary" onClick={() => handleShowPerformance(user)} className="px-3 py-1 text-xs bg-sky-100 text-sky-800 hover:bg-sky-200 focus:ring-sky-300">عملکرد</Button>
                                        <Button variant="secondary" onClick={() => handleEditUser(user)} className="px-3 py-1 text-xs">ویرایش</Button>
                                        <Button variant="danger" onClick={() => setUserToDelete({ id: user.id, name: user.name })} className="px-3 py-1 text-xs">حذف</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                 ) : (
                    <p className="text-center p-6 text-gray-500">کاربری برای نمایش وجود ندارد.</p>
                 )}
            </div>
            
            <Modal
                isOpen={!!userToDelete}
                onClose={handleCancelDelete}
                title="حذف کاربر"
                footer={deleteModalFooter}
            >
                <p className="text-gray-700 text-lg">
                    آیا از حذف کاربر "{userToDelete?.name}" مطمئن هستید؟
                </p>
                 <p className="text-sm text-gray-500 mt-2">توجه: تمام ماموریت‌های تخصیص‌داده‌شده به این کاربر نیز حذف خواهند شد.</p>
            </Modal>
        </>
    );
};

export default UserManagement;