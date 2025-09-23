
// types.ts

export type ModalView = 'CREATE' | 'FULL' | 'VIEW_REPORT';

export enum Role {
    ADMIN = 'مدیر',
    EMPLOYEE = 'کارمند',
}

export enum Department {
    MANAGEMENT = 'مدیریت',
    SALES = 'فروش',
    SUPPORT = 'پشتیبانی',
    DEVELOPMENT = 'برنامه نویسی',
    HUMAN_RESOURCES = 'منابع انسانی',
}

export enum MissionStatus {
    NEW = 'جدید',
    IN_PROGRESS = 'در حال انجام',
    COMPLETED = 'تکمیل شده',
}

export enum DelegationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
}

export interface NewUserData {
    name: string;
    password: string;
    department: Department;
    phone: string;
}

export interface User extends NewUserData {
    id: string;
    role: Role;
    createdat: string; 
}

// --- Dynamic Checklist & Reporting Structure ---

export interface ChecklistItem {
    category: string;
    steps: string[];
}

export interface ChecklistState {
    [category: string]: {
        [step: string]: boolean;
    };
}

export interface MissionReport {
    id: string;
    reporterId: string; // user id
    createdAt: string; // ISO string
    departureTime: string; // ISO string
    returnTime: string; // ISO string
    summary: string; // A text summary for the report
    checklistSnapshot: ChecklistState;
}

export interface Mission {
    id:string;
    subject: string;
    location: string;
    starttime: string; 
    endtime: string; 
    createdby: string; 
    assignedto: string; 
    status: MissionStatus;
    createdat: string;
    checklist: ChecklistItem[]; 
    checkliststate: ChecklistState; 
    reports: MissionReport[]; 
    
    // New delegation fields
    delegated_by?: string; 
    delegation_target?: string;
    delegation_reason?: string;
    delegation_status?: DelegationStatus;
}

// --- Toast Notification System ---
export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}
