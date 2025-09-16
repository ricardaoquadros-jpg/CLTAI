export type IncomeFrequency = 'hourly' | 'daily' | 'monthly_business_days' | 'monthly' | 'monthly_work_hours';

export interface Income {
  amount: number;
  frequency: IncomeFrequency;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface FinancialData {
  income: Income;
  bankBalance: number;
  investments: number;
  workStartTime: string; // HH:mm format
  workEndTime: string;   // HH:mm format
  workDays: number[];    // Array of numbers 0 (Sun) to 6 (Sat)
  totalWorkHoursInMonth?: number;
}
