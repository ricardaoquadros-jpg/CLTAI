
export type SalaryFrequency = 'hourly' | 'daily' | 'monthly_business_days' | 'monthly' | 'monthly_work_hours';

export interface Salary {
  amount: number;
  frequency: SalaryFrequency;
}

export type ExpenseCategory = 'Lazer' | 'Mercado' | 'Investimento' | 'Transporte' | 'Saúde' | 'Educação' | 'Moradia' | 'Outros';

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
}

export interface Investment {
  id: string;
  description: string;
  amount: number;
  date: string;
  annualYield: number;
  yieldOnBusinessDaysOnly?: boolean;
}

export interface FinancialData {
  uid: string;
  email: string | null;
  displayName: string | null;
  salary: Salary;
  bankBalance: number;
  investments: Investment[];
  startTime: string;     // e.g., "09:00"
  endTime: string;       // e.g., "17:00"
  breakStartTime?: string; // e.g., "12:00"
  breakEndTime?: string;   // e.g., "13:00"
  hoursPerDay: number;   // Number of hours worked per day
  workDays: number[];    // Array of numbers 0 (Sun) to 6 (Sat)
  totalWorkHoursInMonth: number;
}
