'use client';
import { useEffect, useMemo, useState } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { FinancialData, Expense } from '@/lib/types';
import { formatCurrency, formatRealTimeCurrency } from '@/lib/utils';
import { SetupForm } from '@/components/dashboard/SetupForm';
import { ExpenseTracker } from '@/components/dashboard/ExpenseTracker';
import Header from '@/components/dashboard/Header';
import { Banknote, Landmark, LineChart, TrendingUp, Wallet, Briefcase, CalendarClock, Eye, EyeOff, Calendar, Hourglass, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { parse } from 'date-fns';


const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_DAY = 86400;
const AVG_DAYS_IN_MONTH = 30.44;
const AVG_BUSINESS_DAYS_IN_MONTH = 22;


function isDuringBreakHours(breakStartTime?: string, breakEndTime?: string): boolean {
  if (!breakStartTime || !breakEndTime) {
    return false;
  }
  try {
    const now = new Date();
    const breakStart = parse(breakStartTime, 'HH:mm', new Date());
    const breakEnd = parse(breakEndTime, 'HH:mm', new Date());
    return now >= breakStart && now <= breakEnd;
  } catch (e) {
    return false;
  }
}

function isDuringWorkHours(workDays: number[], startTime: string, endTime: string, breakStartTime?: string, breakEndTime?: string): boolean {
    if (!workDays || workDays.length === 0) {
      return false;
    }
    const now = new Date();
    const currentDay = now.getDay();
    
    if (!workDays.includes(currentDay)) {
        return false;
    }
    
    if (isDuringBreakHours(breakStartTime, breakEndTime)) {
        return false;
    }

    try {
        const start = parse(startTime, 'HH:mm', new Date());
        const end = parse(endTime, 'HH:mm', new Date());
        return now >= start && now <= end;
    } catch (e) {
        return false;
    }
}

const PrivacyWrapper = ({ isPrivate, children, value }: { isPrivate: boolean, children: React.ReactNode, value: string }) => {
  return (
    <span className={`transition-all ${isPrivate ? 'blur-md' : ''}`}>
      {isPrivate ? value.replace(/[\d,.]/g, '•') : children}
    </span>
  )
}

export default function DashboardPage() {
  const [isClient, setIsClient] = useState(false);
  const [financialData, setFinancialData] = useLocalStorage<FinancialData | null>('financialData', null);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [userName] = useLocalStorage<string | null>('userName', null);
  
  const [realTimeEarnings, setRealTimeEarnings] = useState(0);
  const [realTimeMonthEarnings, setRealTimeMonthEarnings] = useState(0);
  const [workdayProgress, setWorkdayProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);
  
  const earningsPerSecond = useMemo(() => {
    if (!financialData?.salary) return 0;
    const { amount, frequency } = financialData.salary;
    const { hoursPerDay, totalWorkHoursInMonth } = financialData;

    try {
        switch (frequency) {
            case 'hourly':
                return amount / SECONDS_IN_HOUR;
            case 'daily':
                return amount / (hoursPerDay * SECONDS_IN_HOUR);
            case 'monthly_business_days':
                 return amount / (AVG_BUSINESS_DAYS_IN_MONTH * hoursPerDay * SECONDS_IN_HOUR);
            case 'monthly_work_hours':
                if (!totalWorkHoursInMonth || totalWorkHoursInMonth === 0) return 0;
                return amount / (totalWorkHoursInMonth * SECONDS_IN_HOUR);
            case 'monthly':
            default:
                return amount / (AVG_DAYS_IN_MONTH * SECONDS_IN_DAY);
        }
    } catch (e) {
        return 0;
    }
  }, [financialData]);
  
  const totalDailyEarnings = useMemo(() => {
      if (!financialData) return 0;
      return financialData.hoursPerDay * SECONDS_IN_HOUR * earningsPerSecond;
  }, [financialData, earningsPerSecond]);

  const earningsPerHour = useMemo(() => {
    return earningsPerSecond * SECONDS_IN_HOUR;
  }, [earningsPerSecond]);

  useEffect(() => {
    if (!financialData || !financialData.workDays || !financialData.startTime || !financialData.endTime) {
      return;
    }

    const { workDays, startTime, endTime, breakStartTime, breakEndTime } = financialData;

    const calculateEarnings = () => {
      const isWorking = isDuringWorkHours(workDays, startTime, endTime, breakStartTime, breakEndTime);
      const now = new Date();
      const startOfWorkDay = parse(startTime, 'HH:mm', new Date());
      const endOfWorkDay = parse(endTime, 'HH:mm', new Date());

      let currentDayEarnings = 0;
      let progress = 0;

      if (now > startOfWorkDay && now <= endOfWorkDay && isWorking) {
        let elapsedSeconds = (now.getTime() - startOfWorkDay.getTime()) / 1000;
        
        if (breakStartTime && breakEndTime) {
            const breakStart = parse(breakStartTime, 'HH:mm', new Date());
            const breakEnd = parse(breakEndTime, 'HH:mm', new Date());

            if (now > breakEnd) {
                const breakDurationSeconds = (breakEnd.getTime() - breakStart.getTime()) / 1000;
                elapsedSeconds -= breakDurationSeconds;
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
      } else {
        currentDayEarnings = 0;
        progress = 0;
      }

      setRealTimeEarnings(currentDayEarnings);
      setWorkdayProgress(progress > 100 ? 100 : progress);

      // Calculate month earnings
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      let monthToDateEarnings = 0;

      for (let d = startOfMonth; d < today; d.setDate(d.getDate() + 1)) {
        if (workDays.includes(d.getDay())) {
          monthToDateEarnings += totalDailyEarnings;
        }
      }
      
      if (workDays.includes(today.getDay())) {
        monthToDateEarnings += currentDayEarnings;
      }
      
      setRealTimeMonthEarnings(monthToDateEarnings);
    };

    calculateEarnings();
    const timer = setInterval(calculateEarnings, 1000);

    return () => clearInterval(timer);
  }, [financialData, earningsPerSecond, totalDailyEarnings]);

  const handleSetupComplete = (data: FinancialData) => {
    setFinancialData(data);
    setRealTimeEarnings(0);
    setWorkdayProgress(0);
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
    setRealTimeEarnings(0);
  }

  const isWorking = isDuringWorkHours(financialData.workDays, financialData.startTime, financialData.endTime, financialData.breakStartTime, financialData.breakEndTime);
  const inBreak = isDuringBreakHours(financialData.breakStartTime, financialData.breakEndTime);
  const netWorth = financialData.bankBalance + financialData.investments;

  const monthEarningsProgress = (realTimeMonthEarnings / financialData.salary.amount) * 100;
  
  const formattedRealTimeEarnings = formatRealTimeCurrency(realTimeEarnings);
  const formattedRealTimeMonthEarnings = formatRealTimeCurrency(realTimeMonthEarnings);
  const formattedNetWorth = formatCurrency(netWorth);
  const formattedTotalDailyEarnings = formatCurrency(totalDailyEarnings);
  const formattedEarningsPerHour = formatCurrency(earningsPerHour);
  const formattedBankBalance = formatCurrency(financialData.bankBalance);
  const formattedInvestments = formatCurrency(financialData.investments);
  const formattedTotalExpenses = formatCurrency(totalExpenses);
  const formattedSalary = formatCurrency(financialData.salary.amount);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center bg-secondary/50 p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl space-y-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              {userName && <h1 className="text-3xl font-bold tracking-tight mb-2">Olá, {userName}!</h1>}
              <h2 className="text-2xl font-bold tracking-tight font-headline">Seu Painel</h2>
              <p className="text-muted-foreground">Visão geral e simplificada de suas finanças.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setIsPrivacyMode(!isPrivacyMode)} variant="ghost" size="icon">
                  {isPrivacyMode ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  <span className="sr-only">Alternar modo de privacidade</span>
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">Resetar</Button>
            </div>
          </div>
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
              <Card className="w-full text-center">
                  <CardHeader>
                      <CardTitle className="flex items-center justify-center gap-2 text-base font-medium text-muted-foreground">
                      <Banknote className="h-5 w-5" />
                      Ganhos do Dia (Tempo Real)
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-6">
                      <p className="text-5xl font-bold tracking-tighter text-primary">
                          <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedRealTimeEarnings}>
                            {formattedRealTimeEarnings}
                          </PrivacyWrapper>
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                          {isWorking ? 
                            `Ganhos acumulados até agora.` :
                            inBreak ? 
                            `Em horário de intervalo. Ganhos pausados.` :
                            `Fora do expediente.`
                          }
                      </p>
                  </CardContent>
              </Card>
              <Card className="w-full text-center">
                  <CardHeader>
                      <CardTitle className="flex items-center justify-center gap-2 text-base font-medium text-muted-foreground">
                      <Calendar className="h-5 w-5" />
                      Ganhos do Mês (Tempo Real)
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-6 space-y-4">
                      <p className="text-5xl font-bold tracking-tighter text-primary">
                          <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedRealTimeMonthEarnings}>
                            {formattedRealTimeMonthEarnings}
                          </PrivacyWrapper>
                      </p>
                      <div className="space-y-2">
                        <Progress value={monthEarningsProgress} className="w-full h-3" />
                        <p className="text-center text-sm font-bold text-foreground">
                            {monthEarningsProgress.toFixed(2)}% do salário mensal
                        </p>
                      </div>
                  </CardContent>
              </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-[hsl(var(--card-secondary))]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Progresso do Dia
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
                     <p className="text-center text-lg font-bold text-foreground">
                        {workdayProgress.toFixed(2)}%
                     </p>
                   </div>
                </CardContent>
            </Card>
             <Card className="bg-[hsl(var(--card-secondary))]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Resumo Financeiro
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Patrimônio Líquido</p>
                        <p className="text-3xl font-bold">
                          <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedNetWorth}>
                            {formattedNetWorth}
                          </PrivacyWrapper>
                        </p>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><DollarSign className="h-4 w-4" /> Salário</p>
                             <p className="font-semibold">
                               <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedSalary}>
                                 {formattedSalary}
                               </PrivacyWrapper>
                             </p>
                        </div>
                         <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CalendarClock className="h-4 w-4" /> Ganho Diário Total</p>
                             <p className="font-semibold">
                               <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedTotalDailyEarnings}>
                                 {formattedTotalDailyEarnings}
                               </PrivacyWrapper>
                             </p>
                        </div>
                        <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Hourglass className="h-4 w-4" /> Ganho por Hora</p>
                             <p className="font-semibold">
                               <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedEarningsPerHour}>
                                 {formattedEarningsPerHour}
                               </PrivacyWrapper>
                             </p>
                        </div>
                        <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Landmark className="h-4 w-4" /> Saldo em Conta</p>
                             <p className="font-semibold">
                               <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedBankBalance}>
                                 {formattedBankBalance}
                               </PrivacyWrapper>
                             </p>
                        </div>
                         <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><LineChart className="h-4 w-4" /> Investimentos</p>
                             <p className="font-semibold">
                               <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedInvestments}>
                                 {formattedInvestments}
                               </PrivacyWrapper>
                             </p>
                        </div>
                         <div className="flex items-center justify-between">
                             <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Wallet className="h-4 w-4" /> Despesas do Mês</p>
                             <p className="font-semibold">
                               <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedTotalExpenses}>
                                 {formattedTotalExpenses}
                               </PrivacyWrapper>
                             </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <ExpenseTracker 
              expenses={expenses} 
              onAddExpense={handleAddExpense}
              onDeleteExpense={handleDeleteExpense}
              className="bg-[hsl(var(--card-secondary))]"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

    
