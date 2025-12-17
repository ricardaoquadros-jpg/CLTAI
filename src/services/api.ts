/**
 * API Service Layer
 * 
 * Centralizes all API calls for clean separation of concerns.
 * The frontend uses these typed functions instead of direct fetch calls.
 */

import type { FinancialData, Transaction, Investment } from '@/lib/types';

const API_BASE = '/api';

// Type for user data response
interface UserData {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    financialData: {
        id: string;
        userId: string;
        salaryAmount: number;
        salaryFrequency: string;
        bankBalance: number;
        startTime: string;
        endTime: string;
        breakStartTime: string | null;
        breakEndTime: string | null;
        hoursPerDay: number;
        workDays: number[];
        totalWorkHoursInMonth: number;
    } | null;
    investments: Investment[];
}

// Type for API transaction
interface ApiTransaction {
    id: string;
    userId: string;
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category: string;
    balanceBefore: number;
    sortIndex: number;
    createdAt: string;
}

// ===========================
// User & Financial Data
// ===========================

export async function fetchUserData(): Promise<UserData> {
    const res = await fetch(`${API_BASE}/me`);
    if (!res.ok) {
        throw new Error('Failed to fetch user data');
    }
    return res.json();
}

export async function updateFinancialData(data: {
    salaryAmount: number;
    salaryFrequency: string;
    bankBalance: number;
    startTime: string;
    endTime: string;
    breakStartTime?: string | null;
    breakEndTime?: string | null;
    hoursPerDay: number;
    workDays: number[];
    totalWorkHoursInMonth: number;
}) {
    const res = await fetch(`${API_BASE}/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error('Failed to update financial data');
    }
    return res.json();
}

// ===========================
// Transactions
// ===========================

export async function fetchTransactions(): Promise<ApiTransaction[]> {
    const res = await fetch(`${API_BASE}/transactions`);
    if (!res.ok) {
        throw new Error('Failed to fetch transactions');
    }
    return res.json();
}

export async function createTransaction(data: {
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category: string;
    balanceBefore: number;
    sortIndex?: number;
}) {
    const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error('Failed to create transaction');
    }
    return res.json();
}

export async function updateTransaction(id: string, data: Partial<{
    description: string;
    amount: number;
    date: string;
    type: 'income' | 'expense';
    category: string;
    balanceBefore: number;
    sortIndex: number;
}>) {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error('Failed to update transaction');
    }
    return res.json();
}

export async function deleteTransaction(id: string) {
    const res = await fetch(`${API_BASE}/transactions/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error('Failed to delete transaction');
    }
    return res.json();
}

export async function reorderTransactions(updates: Array<{
    id: string;
    sortIndex: number;
    balanceBefore: number;
}>) {
    const res = await fetch(`${API_BASE}/transactions/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!res.ok) {
        throw new Error('Failed to reorder transactions');
    }
    return res.json();
}

// ===========================
// Investments
// ===========================

export async function fetchInvestments(): Promise<Investment[]> {
    const res = await fetch(`${API_BASE}/investments`);
    if (!res.ok) {
        throw new Error('Failed to fetch investments');
    }
    return res.json();
}

export async function createInvestment(data: {
    description: string;
    amount: number;
    date: string;
    annualYield: number;
    yieldOnBusinessDaysOnly?: boolean;
}) {
    const res = await fetch(`${API_BASE}/investments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        throw new Error('Failed to create investment');
    }
    return res.json();
}

export async function deleteInvestment(id: string) {
    const res = await fetch(`${API_BASE}/investments/${id}`, {
        method: 'DELETE',
    });
    if (!res.ok) {
        throw new Error('Failed to delete investment');
    }
    return res.json();
}
