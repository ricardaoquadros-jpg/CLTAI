export type SalaryFrequency = 'hourly' | 'daily' | 'monthly_business_days' | 'monthly' | 'monthly_work_hours';

export interface Salary {
  amount: number;
  frequency: SalaryFrequency;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface FinancialData {
  salary: Salary;
  bankBalance: number;
  investments: number;
  hoursPerDay: number;   // Number of hours worked per day
  workDays: number[];    // Array of numbers 0 (Sun) to 6 (Sat)
  totalWorkHoursInMonth?: number;
}
