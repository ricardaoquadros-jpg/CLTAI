'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import type { Transaction, Investment, ExpenseCategory } from '@/lib/types';
import { formatCurrency, formatRealTimeCurrency, formatInvestmentCurrency } from '@/lib/utils';
import { SetupForm } from '@/components/dashboard/SetupForm';
import { FinancialHistory } from '@/components/dashboard/FinancialHistory';
import Header from '@/components/dashboard/Header';
import { Banknote, Landmark, TrendingUp, Wallet, Briefcase, CalendarClock, Eye, EyeOff, Calendar, Hourglass, DollarSign, CalendarRange, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { parse, getDaysInMonth, differenceInSeconds } from 'date-fns';
import { ExpensesChart } from '@/components/dashboard/ExpensesChart';
import * as api from '@/services/api';

const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_DAY = 86400;
const AVG_BUSINESS_DAYS_IN_MONTH = 22;
const SECONDS_IN_YEAR = 31536000;

// Financial data type adapted for API response
interface FinancialDataState {
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
}

// Transaction type adapted for API
interface TransactionState {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  balanceBefore: number;
  sortIndex: number;
  createdAt: string;
}

function isDuringBreakHours(breakStartTime?: string | null, breakEndTime?: string | null): boolean {
  if (!breakStartTime || !breakEndTime) return false;
  try {
    const now = new Date();
    const breakStart = parse(breakStartTime, 'HH:mm', new Date());
    const breakEnd = parse(breakEndTime, 'HH:mm', new Date());
    return now >= breakStart && now <= breakEnd;
  } catch {
    return false;
  }
}

function isDuringWorkHours(workDays: number[], startTime: string, endTime: string, breakStartTime?: string | null, breakEndTime?: string | null): boolean {
  if (!workDays || workDays.length === 0) return false;
  const now = new Date();
  const currentDay = now.getDay();
  if (!workDays.includes(currentDay)) return false;
  if (isDuringBreakHours(breakStartTime, breakEndTime)) return false;
  try {
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    return now >= start && now <= end;
  } catch {
    return false;
  }
}

const PrivacyWrapper = ({ isPrivate, children, value }: { isPrivate: boolean, children: React.ReactNode, value: string }) => (
  <span className={`transition-all ${isPrivate ? 'blur-md' : ''}`}>
    {isPrivate ? value.replace(/[\d,.]/g, '•') : children}
  </span>
);

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Data states
  const [financialData, setFinancialData] = useState<FinancialDataState | null>(null);
  const [transactions, setTransactions] = useState<TransactionState[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // UI states
  const [realTimeEarnings, setRealTimeEarnings] = useState(0);
  const [realTimeMonthEarnings, setRealTimeMonthEarnings] = useState(0);
  const [realTimeInvestmentEarnings, setRealTimeInvestmentEarnings] = useState(0);
  const [individualInvestmentEarnings, setIndividualInvestmentEarnings] = useState<{ [key: string]: number }>({});
  const [workdayProgress, setWorkdayProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch data on mount
  const fetchData = useCallback(async () => {
    if (status !== 'authenticated') return;

    try {
      setIsLoading(true);
      const [userData, txData] = await Promise.all([
        api.fetchUserData(),
        api.fetchTransactions(),
      ]);

      if (userData.financialData) {
        setFinancialData(userData.financialData);
      }
      setInvestments(userData.investments || []);
      setTransactions(txData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update current time every second
  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  // Calculate totals
  const totalInvestedAmount = useMemo(() => {
    return investments.reduce((acc, inv) => acc + inv.amount, 0);
  }, [investments]);

  const earningsPerSecond = useMemo(() => {
    if (!financialData?.salaryAmount) return 0;
    const { salaryAmount, salaryFrequency, hoursPerDay, totalWorkHoursInMonth } = financialData;

    switch (salaryFrequency) {
      case 'hourly':
        return salaryAmount / SECONDS_IN_HOUR;
      case 'daily':
        return salaryAmount / (hoursPerDay * SECONDS_IN_HOUR);
      case 'monthly_business_days':
        return salaryAmount / (AVG_BUSINESS_DAYS_IN_MONTH * hoursPerDay * SECONDS_IN_HOUR);
      case 'monthly_work_hours':
        if (!totalWorkHoursInMonth || totalWorkHoursInMonth === 0) return 0;
        return salaryAmount / (totalWorkHoursInMonth * SECONDS_IN_HOUR);
      case 'monthly':
      default:
        const daysInCurrentMonth = getDaysInMonth(new Date());
        return salaryAmount / (daysInCurrentMonth * SECONDS_IN_DAY);
    }
  }, [financialData]);

  const totalDailyEarnings = useMemo(() => {
    if (!financialData) return 0;
    if (financialData.salaryFrequency === 'monthly') {
      const daysInCurrentMonth = getDaysInMonth(new Date());
      return financialData.salaryAmount / daysInCurrentMonth;
    }
    return financialData.hoursPerDay * SECONDS_IN_HOUR * earningsPerSecond;
  }, [financialData, earningsPerSecond]);

  const weeklyEarnings = useMemo(() => {
    if (!financialData) return 0;
    if (financialData.salaryFrequency === 'monthly') {
      return totalDailyEarnings * 7;
    }
    return totalDailyEarnings * financialData.workDays.length;
  }, [financialData, totalDailyEarnings]);

  const earningsPerHour = useMemo(() => earningsPerSecond * SECONDS_IN_HOUR, [earningsPerSecond]);

  // Real-time earnings calculation
  useEffect(() => {
    if (!financialData) return;

    const { workDays, startTime, endTime, breakStartTime, breakEndTime, salaryFrequency } = financialData;

    const calculateEarnings = () => {
      const isWorking = isDuringWorkHours(workDays, startTime, endTime, breakStartTime, breakEndTime);
      const now = new Date();
      const startOfWorkDay = parse(startTime, 'HH:mm', new Date());
      const endOfWorkDay = parse(endTime, 'HH:mm', new Date());

      let currentDayEarnings = 0;
      let progress = 0;
      const isMonthlyFrequency = salaryFrequency === 'monthly';

      if (isMonthlyFrequency) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const elapsedSecondsToday = (now.getTime() - startOfDay.getTime()) / 1000;
        currentDayEarnings = elapsedSecondsToday * earningsPerSecond;
      } else {
        if (now > startOfWorkDay && now <= endOfWorkDay && isWorking) {
          let elapsedSeconds = (now.getTime() - startOfWorkDay.getTime()) / 1000;

          if (breakStartTime && breakEndTime) {
            const breakStart = parse(breakStartTime, 'HH:mm', new Date());
            const breakEnd = parse(breakEndTime, 'HH:mm', new Date());
            if (now > breakEnd) {
              elapsedSeconds -= (breakEnd.getTime() - breakStart.getTime()) / 1000;
            } else if (now > breakStart && now < breakEnd) {
              elapsedSeconds -= (now.getTime() - breakStart.getTime()) / 1000;
            }
          }

          currentDayEarnings = elapsedSeconds * earningsPerSecond;
          const totalDuration = endOfWorkDay.getTime() - startOfWorkDay.getTime();
          const elapsedDuration = now.getTime() - startOfWorkDay.getTime();
          progress = (elapsedDuration / totalDuration) * 100;
        } else if (now > endOfWorkDay && workDays.includes(now.getDay())) {
          currentDayEarnings = totalDailyEarnings;
          progress = 100;
        }
      }

      setRealTimeEarnings(currentDayEarnings);
      setWorkdayProgress(Math.min(progress, 100));

      // Month earnings
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      let monthToDateEarnings = 0;

      for (let d = new Date(startOfMonth); d < today; d.setDate(d.getDate() + 1)) {
        if (isMonthlyFrequency || workDays.includes(d.getDay())) {
          monthToDateEarnings += totalDailyEarnings;
        }
      }

      if (isMonthlyFrequency || workDays.includes(today.getDay())) {
        monthToDateEarnings += currentDayEarnings;
      }

      setRealTimeMonthEarnings(monthToDateEarnings);
    };

    const calculateInvestmentEarnings = () => {
      if (investments.length > 0) {
        const now = new Date();
        const currentDay = now.getDay();
        let totalYield = 0;
        const individualYields: { [key: string]: number } = {};

        investments.forEach(investment => {
          const annualYieldDecimal = investment.annualYield / 100;
          const yieldPerSecond = annualYieldDecimal / SECONDS_IN_YEAR;
          const investmentStartDate = new Date(investment.date);
          let investmentYield = 0;

          const isBusinessDay = currentDay >= 1 && currentDay <= 5;
          const shouldCalculateYield = !investment.yieldOnBusinessDaysOnly || isBusinessDay;

          if (now > investmentStartDate && shouldCalculateYield) {
            const secondsSinceInvestment = differenceInSeconds(now, investmentStartDate);
            investmentYield = investment.amount * yieldPerSecond * secondsSinceInvestment;
          }

          individualYields[investment.id] = investmentYield;
          totalYield += investmentYield;
        });

        setIndividualInvestmentEarnings(individualYields);
        setRealTimeInvestmentEarnings(totalYield);
      }
    };

    calculateEarnings();
    calculateInvestmentEarnings();
    const timer = setInterval(() => {
      calculateEarnings();
      calculateInvestmentEarnings();
    }, 1000);

    return () => clearInterval(timer);
  }, [financialData, investments, earningsPerSecond, totalDailyEarnings]);

  // Transaction handlers
  const chronologicallySortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
      if (a.sortIndex !== b.sortIndex) return a.sortIndex - b.sortIndex;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [transactions]);

  const sortedTransactionsForDisplay = useMemo(() => {
    const initialBalance = chronologicallySortedTransactions.find(t => t.description === 'Saldo Inicial');
    const otherTransactions = chronologicallySortedTransactions.filter(t => t.description !== 'Saldo Inicial').reverse();
    return initialBalance ? [...otherTransactions, initialBalance] : otherTransactions;
  }, [chronologicallySortedTransactions]);

  const currentBankBalance = useMemo(() => {
    if (!financialData) return 0;
    if (transactions.length === 0) return financialData.bankBalance || 0;

    let balance = 0;
    chronologicallySortedTransactions.forEach(tx => {
      balance = tx.type === 'income' ? balance + tx.amount : balance - tx.amount;
    });
    return balance;
  }, [financialData, transactions, chronologicallySortedTransactions]);

  const handleSetupComplete = async (data: any) => {
    try {
      await api.updateFinancialData({
        salaryAmount: data.salary.amount,
        salaryFrequency: data.salary.frequency,
        bankBalance: data.bankBalance,
        startTime: data.startTime,
        endTime: data.endTime,
        breakStartTime: data.breakStartTime || null,
        breakEndTime: data.breakEndTime || null,
        hoursPerDay: data.hoursPerDay,
        workDays: data.workDays,
        totalWorkHoursInMonth: data.totalWorkHoursInMonth,
      });

      // Create initial balance transaction if first setup
      if (!isEditing && transactions.length === 0) {
        await api.createTransaction({
          description: 'Saldo Inicial',
          amount: data.bankBalance,
          date: new Date().toISOString(),
          type: 'income',
          category: 'Outros',
          balanceBefore: 0,
          sortIndex: 0,
        });
      }

      await fetchData();
      setIsEditing(false);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error('Error saving financial data:', error);
    }
  };

  const handleAddTransaction = async (transactionData: any) => {
    try {
      await api.createTransaction({
        ...transactionData,
        balanceBefore: currentBankBalance,
        sortIndex: Date.now(),
      });
      await fetchData();
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  };

  const handleUpdateTransaction = async (id: string, updatedData: any) => {
    try {
      await api.updateTransaction(id, updatedData);
      await fetchData();
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      await fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleReorderTransactions = async (reorderedTransactions: any[]): Promise<boolean> => {
    try {
      let previousBalance = 0;
      const updates = reorderedTransactions.map((tx, index) => {
        const update = { id: tx.id, sortIndex: index, balanceBefore: previousBalance };
        previousBalance = tx.type === 'income' ? previousBalance + tx.amount : previousBalance - tx.amount;
        return update;
      });
      await api.reorderTransactions(updates);
      await fetchData();
      return true;
    } catch (error) {
      console.error('Error reordering transactions:', error);
      return false;
    }
  };

  const handleReset = async () => {
    // Delete all transactions
    for (const tx of transactions) {
      await api.deleteTransaction(tx.id);
    }
    // Delete all investments
    for (const inv of investments) {
      await api.deleteInvestment(inv.id);
    }
    setFinancialData(null);
    setTransactions([]);
    setInvestments([]);
    setRealTimeEarnings(0);
  };

  // Expense calculations
  const totalExpensesMonth = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  const monthlyExpensesByCategory = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const expenses = transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const categoryMap = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(categoryMap).map(([category, total]) => ({ category: category as ExpenseCategory, total }));
  }, [transactions]);

  // Loading state
  if (status === 'loading' || isLoading) {
    return <div className="flex min-h-screen w-full flex-col items-center justify-center"><p>Carregando...</p></div>;
  }

  // Setup form
  if (!financialData || isEditing) {
    return <SetupForm onSetupComplete={handleSetupComplete} existingData={isEditing ? {
      salary: { amount: financialData!.salaryAmount, frequency: financialData!.salaryFrequency as any },
      bankBalance: financialData!.bankBalance,
      investments,
      startTime: financialData!.startTime,
      endTime: financialData!.endTime,
      breakStartTime: financialData?.breakStartTime || undefined,
      breakEndTime: financialData?.breakEndTime || undefined,
      hoursPerDay: financialData!.hoursPerDay,
      workDays: financialData!.workDays,
      totalWorkHoursInMonth: financialData!.totalWorkHoursInMonth,
    } as any : undefined} />;
  }

  const isWorking = isDuringWorkHours(financialData.workDays, financialData.startTime, financialData.endTime, financialData.breakStartTime, financialData.breakEndTime);
  const inBreak = isDuringBreakHours(financialData.breakStartTime, financialData.breakEndTime);

  const bankBalance = currentBankBalance;
  const netWorth = bankBalance + totalInvestedAmount + realTimeInvestmentEarnings + realTimeMonthEarnings;
  const monthEarningsProgress = (realTimeMonthEarnings / financialData.salaryAmount) * 100;

  const formattedRealTimeEarnings = formatRealTimeCurrency(realTimeEarnings);
  const formattedRealTimeMonthEarnings = formatRealTimeCurrency(realTimeMonthEarnings);
  const formattedNetWorth = formatCurrency(netWorth);
  const formattedTotalDailyEarnings = formatCurrency(totalDailyEarnings);
  const formattedEarningsPerHour = formatCurrency(earningsPerHour);
  const formattedBankBalance = formatCurrency(bankBalance);
  const formattedInvestments = formatCurrency(totalInvestedAmount);
  const formattedTotalExpenses = formatCurrency(totalExpensesMonth);
  const formattedSalary = formatCurrency(financialData.salaryAmount);
  const formattedWeeklyEarnings = formatCurrency(weeklyEarnings);
  const formattedRealTimeInvestmentEarnings = formatInvestmentCurrency(realTimeInvestmentEarnings);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center bg-[#898c90] p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl space-y-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              {session?.user?.name && <h1 className="text-3xl font-bold tracking-tight mb-2">Olá, {session.user.name.split(' ')[0]}!</h1>}
              <h2 className="text-2xl font-bold tracking-tight font-headline">Seu Painel</h2>
              <p className="text-muted-foreground">Visão geral e simplificada de suas finanças.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsPrivacyMode(!isPrivacyMode)} variant="ghost" size="icon">
                {isPrivacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Pencil className="mr-2 h-4 w-4" />Editar
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">Resetar</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
            <Card className="w-full text-center bg-[#1d2630]">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-base font-medium text-muted-foreground">
                  <Banknote className="h-5 w-5" />Ganhos do Dia (Tempo Real)
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-5xl font-bold tracking-tighter text-primary">
                  <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedRealTimeEarnings}>{formattedRealTimeEarnings}</PrivacyWrapper>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {financialData.salaryFrequency === 'monthly' ? 'Ganhos acumulados ao longo do dia.' :
                    isWorking ? 'Ganhos acumulados até agora.' :
                      inBreak ? 'Em horário de intervalo. Ganhos pausados.' : 'Fora do expediente.'}
                </p>
              </CardContent>
            </Card>
            <Card className="w-full text-center bg-[#1d2630]">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-base font-medium text-muted-foreground">
                  <Calendar className="h-5 w-5" />Ganhos do Mês (Tempo Real)
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6 space-y-4">
                <p className="text-5xl font-bold tracking-tighter text-primary">
                  <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedRealTimeMonthEarnings}>{formattedRealTimeMonthEarnings}</PrivacyWrapper>
                </p>
                <div className="space-y-2">
                  <Progress value={monthEarningsProgress} className="w-full h-3" />
                  <p className="text-center text-sm font-bold text-foreground">{monthEarningsProgress.toFixed(2)}% do salário mensal</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-[#1d2630]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-medium">
                  <Briefcase className="h-5 w-5 text-primary" />Progresso do Dia
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4 pt-2">
                <div className="text-center">
                  <p className="font-semibold text-lg">{currentTime.toLocaleTimeString('pt-BR')}</p>
                  <p className="text-sm text-muted-foreground">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>Início: {financialData.startTime}</span>
                    <span>Fim: {financialData.endTime}</span>
                  </div>
                  <Progress value={workdayProgress} className="w-full h-3" />
                  <p className="text-center text-lg font-bold text-foreground">{workdayProgress.toFixed(2)}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1d2630]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" />Resumo Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground">Patrimônio Líquido</p>
                  <p className="text-3xl font-bold"><PrivacyWrapper isPrivate={isPrivacyMode} value={formattedNetWorth}>{formattedNetWorth}</PrivacyWrapper></p>
                </div>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Salário</p>
                    <p className="font-semibold"><PrivacyWrapper isPrivate={isPrivacyMode} value={formattedSalary}>{formattedSalary}</PrivacyWrapper></p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CalendarRange className="h-4 w-4" /> Ganho Semanal</p>
                    <p className="font-semibold"><PrivacyWrapper isPrivate={isPrivacyMode} value={formattedWeeklyEarnings}>{formattedWeeklyEarnings}</PrivacyWrapper></p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Ganho Diário Total</p>
                    <p className="font-semibold"><PrivacyWrapper isPrivate={isPrivacyMode} value={formattedTotalDailyEarnings}>{formattedTotalDailyEarnings}</PrivacyWrapper></p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Hourglass className="h-4 w-4" /> Ganho por Hora</p>
                    <p className="font-semibold"><PrivacyWrapper isPrivate={isPrivacyMode} value={formattedEarningsPerHour}>{formattedEarningsPerHour}</PrivacyWrapper></p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Landmark className="h-4 w-4" /> Saldo em Conta</p>
                    <p className="font-semibold"><PrivacyWrapper isPrivate={isPrivacyMode} value={formattedBankBalance}>{formattedBankBalance}</PrivacyWrapper></p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Wallet className="h-4 w-4" /> Despesas do Mês</p>
                    <p className="font-semibold"><PrivacyWrapper isPrivate={isPrivacyMode} value={formattedTotalExpenses}>{formattedTotalExpenses}</PrivacyWrapper></p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ExpensesChart title="Despesas do Mês" description="Distribuição das despesas por categoria" data={monthlyExpensesByCategory} totalValue={totalExpensesMonth} />
          </div>

          <FinancialHistory
            transactions={sortedTransactionsForDisplay as any}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onReorderTransactions={handleReorderTransactions}
          />
        </div>
      </main>
    </div>
  );
}
