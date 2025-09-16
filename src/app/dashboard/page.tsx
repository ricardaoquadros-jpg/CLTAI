'use client';
import { useEffect, useMemo, useState } from 'react';
import useLocalStorage from '@/hooks/useLocalStorage';
import type { FinancialData, Expense, IncomeFrequency } from '@/lib/types';
import { formatCurrency, formatRealTimeCurrency } from '@/lib/utils';
import { SetupForm } from '@/components/dashboard/SetupForm';
import { ExpenseTracker } from '@/components/dashboard/ExpenseTracker';
import Header from '@/components/dashboard/Header';
import FinancialCard from '@/components/dashboard/FinancialCard';
import { Banknote, Landmark, LineChart, TrendingUp, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const SECONDS_IN = {
  hourly: 3600,
  daily: 86400,
  monthly_business_days: 22 * 8 * 3600,
  monthly: 30.44 * 24 * 3600,
};

function isDuringWorkHours(startTime: string, endTime: string): boolean {
    const now = new Date();
    const start = new Date();
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    start.setHours(startHours, startMinutes, 0, 0);

    const end = new Date();
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    end.setHours(endHours, endMinutes, 0, 0);
    
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

  useEffect(() => {
    setIsClient(true);
  }, []);

  const earningsPerSecond = useMemo(() => {
    if (!financialData?.income) return 0;
    const { amount, frequency } = financialData.income;
    return amount / SECONDS_IN[frequency];
  }, [financialData]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (financialData && isDuringWorkHours(financialData.workStartTime, financialData.workEndTime)) {
         setEarnings((prev) => prev + earningsPerSecond);
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
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

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

  const isWorking = isDuringWorkHours(financialData.workStartTime, financialData.workEndTime);

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 bg-secondary/50 p-4 sm:p-6 md:p-8">
        <div className="container mx-auto">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight font-headline">Painel</h2>
              <p className="text-muted-foreground">Sua visão financeira em tempo real.</p>
            </div>
             <Button onClick={handleReset} variant="outline">Resetar Dados</Button>
          </div>
          <div className="grid gap-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FinancialCard
                title="Saldo Bancário"
                icon={<Landmark className="h-5 w-5" />}
                value={formatCurrency(financialData.bankBalance)}
                description="Total de dinheiro disponível"
              />
              <FinancialCard
                title="Investimentos"
                icon={<LineChart className="h-5 w-5" />}
                value={formatCurrency(financialData.investments)}
                description="Valor de todos os ativos"
              />
              <FinancialCard
                title="Despesas Totais"
                icon={<Wallet className="h-5 w-5" />}
                value={formatCurrency(totalExpenses)}
                description="Gasto este mês"
              />
              <FinancialCard
                title="Patrimônio Líquido"
                icon={<TrendingUp className="h-5 w-5" />}
                value={formatCurrency(financialData.bankBalance + financialData.investments)}
                description="Saldo + Investimentos"
              />
            </div>
            
            <Card>
              <CardHeader className="items-center">
                <CardTitle className="flex items-center gap-2">
                   <Banknote className="h-5 w-5 text-muted-foreground" />
                   Ganhos em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-6xl font-bold tracking-tighter text-primary">
                    {formatRealTimeCurrency(earnings)}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                    {isWorking ? 
                      `Ganhando agora. Expediente: ${financialData.workStartTime} - ${financialData.workEndTime}` :
                      `Fora do expediente. O contador está pausado.`
                    }
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                    Baseado na sua renda {financialData.income.frequency} de {formatCurrency(financialData.income.amount)}.
                </p>
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
