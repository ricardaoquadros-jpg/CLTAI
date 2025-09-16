'use client';
import { useEffect, useMemo, useState } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { FinancialData, Expense, IncomeFrequency } from '@/lib/types';
import { formatCurrency, formatRealTimeCurrency } from '@/lib/utils';
import { SetupForm } from '@/components/dashboard/SetupForm';
import { ExpenseTracker } from '@/components/dashboard/ExpenseTracker';
import Header from '@/components/dashboard/Header';
import { Banknote, Landmark, LineChart, TrendingUp, Wallet, Clock, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';


const SECONDS_IN = {
  hourly: 3600,
  daily: 86400,
  monthly_business_days: 22 * 8 * 3600,
  monthly: 30.44 * 24 * 3600,
};

function parseTimeToDate(timeStr: string): Date {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

function isDuringWorkHours(startTime: string, endTime: string, workDays: number[]): boolean {
    if (!startTime || !endTime || !workDays || workDays.length === 0) {
      return false;
    }
    const now = new Date();
    const currentDay = now.getDay();
    
    if (!workDays.includes(currentDay)) {
        return false;
    }

    const start = parseTimeToDate(startTime);
    const end = parseTimeToDate(endTime);
    
    // Handle overnight shifts
    if (end < start) {
        // If current time is after start or before end (on the next day)
        return now >= start || now <= end;
    }

    return now >= start && now <= end;
}

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [financialData, setFinancialData] = useLocalStorage<FinancialData | null>('financialData', null);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  
  const [earnings, setEarnings] = useState(0);
  const [workdayProgress, setWorkdayProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    setIsClient(true);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);
  
  const earningsPerSecond = useMemo(() => {
    if (!financialData?.income) return 0;
    const { amount, frequency } = financialData.income;
    return amount / SECONDS_IN[frequency];
  }, [financialData]);

  useEffect(() => {
    if (!financialData?.workStartTime || !financialData?.workEndTime || !financialData?.workDays) {
      return;
    }
    const timer = setInterval(() => {
      const isWorking = isDuringWorkHours(financialData.workStartTime, financialData.workEndTime, financialData.workDays);
      if (financialData && isWorking) {
         setEarnings((prev) => prev + earningsPerSecond);
      }
       // Calculate workday progress
      const now = new Date();
      const start = parseTimeToDate(financialData.workStartTime);
      let end = parseTimeToDate(financialData.workEndTime);

      if (end < start) { // overnight shift
        end.setDate(end.getDate() + 1);
        if (now < start) {
          now.setDate(now.getDate() + 1);
        }
      }

      if (now < start || !isWorking) {
          setWorkdayProgress(0);
      } else if (now > end) {
          setWorkdayProgress(100);
      } else {
          const totalDuration = end.getTime() - start.getTime();
          const elapsedDuration = now.getTime() - start.getTime();
          const progress = (elapsedDuration / totalDuration) * 100;
          setWorkdayProgress(progress);
      }

    }, 1000);

    return () => clearInterval(timer);
  }, [earningsPerSecond, financialData]);

  const handleSetupComplete = (data: FinancialData) => {
    setFinancialData(data);
  };
  
  const handleAddExpense = (expenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: new Date().toISOString(),
      date: new Date().toISOString(),
    };
    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);
    
    if (financialData) {
      setFinancialData({
        ...financialData,
        bankBalance: financialData.bankBalance - newExpense.amount,
      });
    }
  };

  const handleDeleteExpense = (id: string) => {
    const expenseToDelete = expenses.find(exp => exp.id === id);
    if (!expenseToDelete) return;

    const updatedExpenses = expenses.filter(exp => exp.id !== id);
    setExpenses(updatedExpenses);

    if (financialData) {
      setFinancialData({
        ...financialData,
        bankBalance: financialData.bankBalance + expenseToDelete.amount,
      });
    }
  };
  
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0)
  }, [expenses]);

  if (!isClient) {
    return null; // or a loading skeleton
  }

  if (!financialData) {
    return <SetupForm onSetupComplete={handleSetupComplete} />;
  }
  
  const handleReset = () => {
    setFinancialData(null);
    setExpenses([]);
    setEarnings(0);
  }

  const isWorking = isDuringWorkHours(financialData.workStartTime, financialData.workEndTime, financialData.workDays);
  const netWorth = financialData.bankBalance + financialData.investments;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center bg-secondary/50 p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight font-headline">Seu Painel</h2>
              <p className="text-muted-foreground">Visão geral e simplificada de suas finanças.</p>
            </div>
             <Button onClick={handleReset} variant="outline" size="sm">Resetar</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="md:col-span-2 text-center">
              <CardHeader>
                <CardTitle className="flex items-center justify-center gap-2 text-base font-medium text-muted-foreground">
                   <Banknote className="h-5 w-5" />
                   Ganhos em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-6">
                <p className="text-5xl font-bold tracking-tighter text-primary">
                    {formatRealTimeCurrency(earnings)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                    {isWorking ? 
                      `Ganhando agora.` :
                      `Fora do expediente. O contador está pausado.`
                    }
                </p>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Progresso do Expediente
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4 pt-2">
                    <div className="text-center">
                        <p className="font-semibold text-lg">{currentTime.toLocaleTimeString('pt-BR')}</p>
                        <p className="text-sm text-muted-foreground">{currentTime.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                   <div className="w-full space-y-2">
                     <div className="flex justify-between text-sm font-medium text-muted-foreground">
                        <span>Início: {financialData.workStartTime}</span>
                        <span>Fim: {financialData.workEndTime}</span>
                     </div>
                     <Progress value={workdayProgress} className="w-full h-3" />
                     <p className="text-center text-lg font-bold text-foreground">
                        {workdayProgress.toFixed(0)}%
                     </p>
                   </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Resumo Financeiro
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Patrimônio Líquido</p>
                        <p className="text-3xl font-bold">{formatCurrency(netWorth)}</p>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Landmark className="h-4 w-4" /> Saldo em Conta</p>
                             <p className="font-semibold">{formatCurrency(financialData.bankBalance)}</p>
                        </div>
                         <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><LineChart className="h-4 w-4" /> Investimentos</p>
                             <p className="font-semibold">{formatCurrency(financialData.investments)}</p>
                        </div>
                         <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Wallet className="h-4 w-4" /> Despesas do Mês</p>
                             <p className="font-semibold">{formatCurrency(totalExpenses)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <ExpenseTracker 
              expenses={expenses} 
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
