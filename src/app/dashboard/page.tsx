
'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, collection, deleteField, writeBatch, serverTimestamp } from 'firebase/firestore';
import { useUser, useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import type { FinancialData, Transaction, Investment, ExpenseCategory } from '@/lib/types';
import { formatCurrency, formatRealTimeCurrency, formatInvestmentCurrency } from '@/lib/utils';
import { SetupForm } from '@/components/dashboard/SetupForm';
import { FinancialHistory } from '@/components/dashboard/FinancialHistory';
import Header from '@/components/dashboard/Header';
import { Banknote, Landmark, LineChart, TrendingUp, Wallet, Briefcase, CalendarClock, Eye, EyeOff, Calendar, Hourglass, DollarSign, CalendarRange, Percent, PiggyBank } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { parse, getDaysInMonth, startOfYear, differenceInSeconds } from 'date-fns';
import { ExpensesChart } from '@/components/dashboard/ExpensesChart';


const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_DAY = 86400;
const AVG_DAYS_IN_MONTH = 30.44;
const AVG_BUSINESS_DAYS_IN_MONTH = 22;
const SECONDS_IN_YEAR = 31536000; // 365 * 24 * 60 * 60


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
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const financialDataRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const transactionsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [firestore, user]);

  const { data: financialData, isLoading: isFinancialDataLoading } = useDoc<FinancialData>(financialDataRef);
  const { data: transactions, isLoading: areTransactionsLoading } = useCollection<Transaction>(transactionsRef);

  const [realTimeEarnings, setRealTimeEarnings] = useState(0);
  const [realTimeMonthEarnings, setRealTimeMonthEarnings] = useState(0);
  const [realTimeInvestmentEarnings, setRealTimeInvestmentEarnings] = useState(0);
  const [individualInvestmentEarnings, setIndividualInvestmentEarnings] = useState<{[key: string]: number}>({});
  const [workdayProgress, setWorkdayProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timeInterval);
  }, []);

  const totalInvestedAmount = useMemo(() => {
    if (!financialData?.investments) return 0;
    return financialData.investments.reduce((acc, inv) => acc + inv.amount, 0);
  }, [financialData]);

  const averageInvestmentYield = useMemo(() => {
    if (!financialData?.investments || financialData.investments.length === 0 || totalInvestedAmount === 0) {
      return 0;
    }
    const weightedYieldSum = financialData.investments.reduce((acc, inv) => acc + inv.amount * inv.annualYield, 0);
    return weightedYieldSum / totalInvestedAmount;
  }, [financialData, totalInvestedAmount]);
  
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
                const daysInCurrentMonth = getDaysInMonth(new Date());
                return amount / (daysInCurrentMonth * SECONDS_IN_DAY);
        }
    } catch (e) {
        return 0;
    }
  }, [financialData]);
  
  const totalDailyEarnings = useMemo(() => {
      if (!financialData || !financialData.salary) return 0;
      if (financialData.salary.frequency === 'monthly') {
        const daysInCurrentMonth = getDaysInMonth(new Date());
        return financialData.salary.amount / daysInCurrentMonth;
      }
      return financialData.hoursPerDay * SECONDS_IN_HOUR * earningsPerSecond;
  }, [financialData, earningsPerSecond]);

  const weeklyEarnings = useMemo(() => {
    if (!financialData || !financialData.salary) return 0;
    if (financialData.salary.frequency === 'monthly') {
      return totalDailyEarnings * 7;
    }
    return totalDailyEarnings * financialData.workDays.length;
  }, [financialData, totalDailyEarnings]);

  const earningsPerHour = useMemo(() => {
    return earningsPerSecond * SECONDS_IN_HOUR;
  }, [earningsPerSecond]);

  useEffect(() => {
    if (!financialData || !financialData.workDays || !financialData.startTime || !financialData.endTime || !financialData.salary) {
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
      const isMonthlyFrequency = financialData.salary.frequency === 'monthly';

      if (isMonthlyFrequency) {
          const startOfDay = new Date();
          startOfDay.setHours(0, 0, 0, 0);
          const elapsedSecondsToday = (now.getTime() - startOfDay.getTime()) / 1000;
          currentDayEarnings = elapsedSecondsToday * earningsPerSecond;
          
          if (now.getHours() === 23 && now.getMinutes() === 59 && now.getSeconds() === 59) {
              currentDayEarnings = totalDailyEarnings;
          }

      } else {
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
      }

      setRealTimeEarnings(currentDayEarnings);
      setWorkdayProgress(progress > 100 ? 100 : progress);

      // Calculate month earnings
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
        if (financialData.investments && financialData.investments.length > 0) {
            const now = new Date();
            const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
            let totalYield = 0;
            const individualYields: {[key: string]: number} = {};
            
            financialData.investments.forEach(investment => {
                const annualYieldDecimal = investment.annualYield / 100;
                const yieldPerSecond = annualYieldDecimal / SECONDS_IN_YEAR;
                const investmentStartDate = new Date(investment.date);
                let investmentYield = 0;

                const isBusinessDay = currentDay >= 1 && currentDay <= 5;
                const shouldCalculateYield = !investment.yieldOnBusinessDaysOnly || isBusinessDay;

                if (now > investmentStartDate && shouldCalculateYield) {
                    const secondsSinceInvestment = differenceInSeconds(now, investmentStartDate);
                    investmentYield = investment.amount * yieldPerSecond * secondsSinceInvestment;
                } else if (now > investmentStartDate && investment.yieldOnBusinessDaysOnly && !isBusinessDay) {
                    // if it is weekend, we need to calculate based on the last business day (friday)
                    const lastFriday = new Date(now);
                    lastFriday.setDate(now.getDate() - (currentDay === 6 ? 1 : 2)); // Sat -> -1, Sun -> -2
                    lastFriday.setHours(23, 59, 59, 999);
                     if (lastFriday > investmentStartDate) {
                        const secondsSinceInvestment = differenceInSeconds(lastFriday, investmentStartDate);
                        investmentYield = investment.amount * yieldPerSecond * secondsSinceInvestment;
                    }
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
  }, [financialData, earningsPerSecond, totalDailyEarnings]);

  const chronologicallySortedTransactions = useMemo(() => {
    if (!transactions) return [];
  
    const toDate = (ts: any) => {
      if (ts instanceof Date) return ts;
      if (ts && typeof ts.seconds === 'number' && typeof ts.nanoseconds === 'number') {
        return new Date(ts.seconds * 1000 + ts.nanoseconds / 1000000);
      }
      return new Date(ts);
    };
  
    return [...transactions].sort((a, b) => {
      const dateA = toDate(a.date);
      const dateB = toDate(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      // If dates are the same, sort by sortIndex, then by createdAt
      if(a.sortIndex !== b.sortIndex) {
        return a.sortIndex - b.sortIndex;
      }
      const createdAtA = toDate(a.createdAt);
      const createdAtB = toDate(b.createdAt);
      return createdAtA.getTime() - createdAtB.getTime();
    });
  }, [transactions]);
  
  
  const sortedTransactionsForDisplay = useMemo(() => {
    const initialBalance = chronologicallySortedTransactions.find(t => t.description === 'Saldo Inicial');
    const otherTransactions = chronologicallySortedTransactions
      .filter(t => t.description !== 'Saldo Inicial')
      .reverse(); // reverse for descending display order
    
    return initialBalance ? [...otherTransactions, initialBalance] : otherTransactions;
  }, [chronologicallySortedTransactions]);
  
  const currentBankBalance = useMemo(() => {
    if (!financialData) return 0;
    if (!transactions || transactions.length === 0) return financialData.bankBalance || 0;
    
    let balance = 0;
    chronologicallySortedTransactions.forEach(tx => {
      if (tx.type === 'income') {
        balance += tx.amount;
      } else {
        balance -= tx.amount;
      }
    });
  
    return balance;
  }, [financialData, transactions, chronologicallySortedTransactions]);


  const handleSetupComplete = (data: Omit<FinancialData, 'uid' | 'email' | 'displayName'>) => {
    if (financialDataRef && user && transactionsRef) {
      const initialProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...data
      };
      setDocumentNonBlocking(financialDataRef, initialProfile, { merge: true });

      const initialTransaction = {
        description: 'Saldo Inicial',
        amount: data.bankBalance,
        date: new Date().toISOString(),
        type: 'income' as const,
        category: 'Outros' as const,
        balanceBefore: 0,
        createdAt: serverTimestamp(),
        userId: user.uid,
        sortIndex: 0,
      };
      addDocumentNonBlocking(transactionsRef, initialTransaction);
    }

    setRealTimeEarnings(0);
    setWorkdayProgress(0);
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  };
  
  const handleAddTransaction = (transactionData: Omit<Transaction, 'id' | 'balanceBefore' | 'userId' | 'createdAt' | 'sortIndex'>) => {
    if (transactionsRef && financialData && user) {
      const balanceBefore = currentBankBalance;
      
      const newTransaction = {
        ...transactionData,
        userId: user.uid,
        balanceBefore: balanceBefore,
        createdAt: serverTimestamp(),
        sortIndex: Date.now(),
      };
      addDocumentNonBlocking(transactionsRef, newTransaction);
    }
  };

  const handleUpdateTransaction = async (id: string, updatedData: Partial<Omit<Transaction, 'id' | 'userId'>>) => {
    if (!firestore || !user || !transactions) return;
    
    const batch = writeBatch(firestore);

    const tempUpdatedTransactions = transactions.map(t => 
      t.id === id ? { ...t, ...updatedData } : t
    );

    const toDate = (ts: any) => {
      if (ts instanceof Date) return ts;
      if (ts && typeof ts.seconds === 'number' && typeof ts.nanoseconds === 'number') {
        return new Date(ts.seconds * 1000 + ts.nanoseconds / 1000000);
      }
      return new Date(ts);
    };

    tempUpdatedTransactions.sort((a, b) => {
      const dateA = toDate(a.date);
      const dateB = toDate(b.date);
      if(dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      if(a.sortIndex !== b.sortIndex) {
        return a.sortIndex - b.sortIndex;
      }
      const createdAtA = toDate(a.createdAt);
      const createdAtB = toDate(b.createdAt);
      return createdAtA.getTime() - createdAtB.getTime();
    });

    let previousBalance = 0;
    for (const tx of tempUpdatedTransactions) {
      const txRef = doc(firestore, 'users', user.uid, 'transactions', tx.id);
      
      const updatePayload: any = {};

      if (tx.id === id) {
        Object.assign(updatePayload, updatedData);
      }

      if (tx.balanceBefore !== previousBalance) {
        updatePayload.balanceBefore = previousBalance;
      }

      if (Object.keys(updatePayload).length > 0) {
        batch.update(txRef, updatePayload);
      }
      
      previousBalance = tx.type === 'income' ? previousBalance + tx.amount : previousBalance - tx.amount;
    }
    
    await batch.commit();
  }

  const handleReorderTransactions = async (reorderedTransactions: Transaction[]) => {
    if (!firestore || !user) return;
  
    const batch = writeBatch(firestore);
    
    let previousBalance = 0;
    reorderedTransactions.forEach((tx, index) => {
      const txRef = doc(firestore, 'users', user.uid, 'transactions', tx.id);
      
      const updatePayload: any = {
        sortIndex: index,
        balanceBefore: previousBalance,
      };
      
      batch.update(txRef, updatePayload);
      
      previousBalance = tx.type === 'income' ? previousBalance + tx.amount : previousBalance - tx.amount;
    });
  
    await batch.commit();
  };
  

  const handleDeleteTransaction = (id: string) => {
    if (!firestore || !user || !transactions) return;
    const transactionToDelete = transactions.find(exp => exp.id === id);
    if (!transactionToDelete) return;
    
    const transactionDocRef = doc(firestore, 'users', user.uid, 'transactions', id);
    deleteDocumentNonBlocking(transactionDocRef);
  };
  
  const handleReset = () => {
    if (financialDataRef && user) {
       const resetData = {
        salary: deleteField(),
        investments: deleteField(),
        startTime: deleteField(),
        endTime: deleteField(),
        breakStartTime: deleteField(),
        breakEndTime: deleteField(),
        hoursPerDay: deleteField(),
        workDays: deleteField(),
        totalWorkHoursInMonth: deleteField(),
      };
      updateDocumentNonBlocking(financialDataRef, resetData);
    }
    if (transactions) {
      transactions.forEach(transaction => {
        if(user && firestore) {
          const transactionDocRef = doc(firestore, 'users', user.uid, 'transactions', transaction.id);
          deleteDocumentNonBlocking(transactionDocRef);
        }
      })
    }
    setRealTimeEarnings(0);
  }

  const totalExpensesMonth = useMemo(() => {
    if (!transactions) return 0;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    return transactions
        .filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' && transactionDate.getMonth() === currentMonth && transactionDate.getFullYear() === currentYear;
        })
        .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);
  
    const monthlyExpensesByCategory = useMemo(() => {
        if (!transactions) return [];
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const expenses = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return t.type === 'expense' &&
                   transactionDate.getMonth() === currentMonth &&
                   transactionDate.getFullYear() === currentYear;
        });

        const categoryMap = expenses.reduce((acc, expense) => {
            if (!acc[expense.category]) {
                acc[expense.category] = 0;
            }
            acc[expense.category] += expense.amount;
            return acc;
        }, {} as Record<ExpenseCategory, number>);

        return Object.entries(categoryMap).map(([category, total]) => ({
            category: category as ExpenseCategory,
            total,
        }));
    }, [transactions]);

    const totalAllTimeExpenses = useMemo(() => {
        if (!transactions) return 0;
        return transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    }, [transactions]);

    const allExpensesByCategory = useMemo(() => {
        if (!transactions) return [];
        
        const expenses = transactions.filter(t => t.type === 'expense');

        const categoryMap = expenses.reduce((acc, expense) => {
            if (!acc[expense.category]) {
                acc[expense.category] = 0;
            }
            acc[expense.category] += expense.amount;
            return acc;
        }, {} as Record<ExpenseCategory, number>);

        return Object.entries(categoryMap).map(([category, total]) => ({
            category: category as ExpenseCategory,
            total,
        }));
    }, [transactions]);


  if (isUserLoading || isFinancialDataLoading || areTransactionsLoading) {
    return <div className="flex min-h-screen w-full flex-col items-center justify-center"><p>Carregando...</p></div>;
  }

  if (!financialData || !financialData.salary) {
    return <SetupForm onSetupComplete={handleSetupComplete} />;
  }

  const isWorking = isDuringWorkHours(financialData.workDays, financialData.startTime, financialData.endTime, financialData.breakStartTime, financialData.breakEndTime);
  const inBreak = isDuringBreakHours(financialData.breakStartTime, financialData.breakEndTime);
  
  const bankBalance = currentBankBalance;
  const netWorth = bankBalance + totalInvestedAmount + realTimeInvestmentEarnings + realTimeMonthEarnings;
  
  const monthEarningsProgress = (realTimeMonthEarnings / financialData.salary.amount) * 100;
  
  const formattedRealTimeEarnings = formatRealTimeCurrency(realTimeEarnings);
  const formattedRealTimeMonthEarnings = formatRealTimeCurrency(realTimeMonthEarnings);
  const formattedNetWorth = formatCurrency(netWorth);
  const formattedTotalDailyEarnings = formatCurrency(totalDailyEarnings);
  const formattedEarningsPerHour = formatCurrency(earningsPerHour);
  const formattedBankBalance = formatCurrency(bankBalance);
  const formattedInvestments = formatCurrency(totalInvestedAmount);
  const formattedTotalExpenses = formatCurrency(totalExpensesMonth);
  const formattedSalary = formatCurrency(financialData.salary.amount);
  const formattedWeeklyEarnings = formatCurrency(weeklyEarnings);
  const formattedRealTimeInvestmentEarnings = formatInvestmentCurrency(realTimeInvestmentEarnings);

  const monthlyBreakdownData = [
    { category: 'Disponível', total: bankBalance },
    ...monthlyExpensesByCategory,
  ];
  const totalMonthlyBreakdown = bankBalance + totalExpensesMonth;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center bg-[#898c90] p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl space-y-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              {user?.displayName && <h1 className="text-3xl font-bold tracking-tight mb-2">Olá, {user.displayName.split(' ')[0]}!</h1>}
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
              <Card className="w-full text-center bg-[#1d2630]">
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
                          {financialData.salary.frequency === 'monthly' ?
                            `Ganhos acumulados ao longo do dia.` :
                            isWorking ? 
                            `Ganhos acumulados até agora.` :
                            inBreak ? 
                            `Em horário de intervalo. Ganhos pausados.` :
                            `Fora do expediente.`
                          }
                      </p>
                  </CardContent>
              </Card>
              <Card className="w-full text-center bg-[#1d2630]">
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
            <Card className="bg-[#1d2630]">
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
            
            <Card className="bg-[#1d2630]">
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
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CalendarRange className="h-4 w-4" /> Ganho Semanal</p>
                            <p className="font-semibold">
                                <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedWeeklyEarnings}>
                                {formattedWeeklyEarnings}
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

            <Card className="bg-[#1d2630]">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <LineChart className="h-5 w-5 text-primary" />
                        Investimentos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <div className='flex items-baseline justify-between'>
                            <div>
                                <p className="text-sm text-muted-foreground">Valor Total Investido</p>
                                <p className="text-3xl font-bold">
                                  <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedInvestments}>
                                    {formattedInvestments}
                                  </PrivacyWrapper>
                                </p>
                            </div>
                            <div className='text-right'>
                                <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-end">
                                    <TrendingUp className="h-4 w-4" /> Ganhos
                                </p>
                                <p className="font-semibold text-green-400">
                                  <PrivacyWrapper isPrivate={isPrivacyMode} value={formattedRealTimeInvestmentEarnings}>
                                      {formattedRealTimeInvestmentEarnings}
                                  </PrivacyWrapper>
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    {financialData.investments.length > 0 && (
                        <div className="space-y-4">
                            <Separator />
                            <div className='space-y-3'>
                                {financialData.investments.map(inv => (
                                    <div key={inv.id} className="flex items-start justify-between text-sm">
                                        <div className='flex items-center gap-2'>
                                            <PiggyBank className='h-5 w-5 text-primary/70 mt-1'/>
                                            <div>
                                                <p className='font-semibold'>{inv.description}</p>
                                                <p className='text-xs text-muted-foreground'>{formatCurrency(inv.amount)}</p>
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <p className="font-semibold">{(inv.annualYield / 12).toFixed(2)}% <span className='text-xs text-muted-foreground'>ao mês</span></p>
                                            <p className='font-semibold text-green-400 text-xs'>
                                              <PrivacyWrapper isPrivate={isPrivacyMode} value={formatInvestmentCurrency(individualInvestmentEarnings[inv.id] || 0)}>
                                                {formatInvestmentCurrency(individualInvestmentEarnings[inv.id] || 0)}
                                              </PrivacyWrapper>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between pt-2">
                                <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Percent className="h-4 w-4" /> Rendimento Médio Anual
                                </p>
                                <p className="font-semibold">
                                    <PrivacyWrapper isPrivate={isPrivacyMode} value={`${averageInvestmentYield.toFixed(2)}%`}>
                                      {averageInvestmentYield.toFixed(2)}%
                                    </PrivacyWrapper>
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <FinancialHistory 
              transactions={chronologicallySortedTransactions}
              onAddTransaction={handleAddTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onReorderTransactions={handleReorderTransactions}
            />
          </div>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
              {monthlyExpensesByCategory.length > 0 && (
                <ExpensesChart 
                    title="Despesas do Mês por Categoria"
                    description="Uma visão detalhada de onde seu dinheiro foi este mês."
                    data={monthlyExpensesByCategory}
                    totalValue={totalExpensesMonth}
                />
              )}
               {monthlyBreakdownData.length > 1 && (
                 <ExpensesChart 
                    title="Detalhamento Mensal"
                    description="Comparação entre o saldo disponível e as categorias de despesas."
                    data={monthlyBreakdownData}
                    totalValue={totalMonthlyBreakdown}
                />
               )}
           </div>
           {allExpensesByCategory.length > 0 && (
             <div className="mt-8">
                <ExpensesChart 
                    title="Todas as Despesas por Categoria"
                    description="Visão geral de todas as suas despesas."
                    data={allExpensesByCategory}
                    totalValue={totalAllTimeExpenses}
                />
            </div>
           )}
        </div>
      </main>
    </div>
  );
}

    