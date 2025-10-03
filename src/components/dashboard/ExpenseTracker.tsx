
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { Expense, ExpenseCategory } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';

const expenseCategories: ExpenseCategory[] = ['Lazer', 'Mercado', 'Investimento', 'Transporte', 'Saúde', 'Educação', 'Moradia', 'Outros'];

const formSchema = z.object({
  description: z.string().min(2, { message: 'A descrição deve ter pelo menos 2 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'Por favor, insira um valor positivo.' }),
  category: z.enum(expenseCategories, { required_error: 'Por favor, selecione uma categoria.' }),
});

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  onDeleteExpense: (id: string) => void;
  className?: string;
}

export function ExpenseTracker({ expenses, onAddExpense, onDeleteExpense, className }: ExpenseTrackerProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddExpense(values);
    form.reset();
  }
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Card className={cn("col-span-1 md:col-span-2 bg-[#1d2630]", className)}>
      <CardHeader>
        <CardTitle>Controle de Despesas</CardTitle>
        <CardDescription>Registre e visualize suas despesas para este mês. Total: {formatCurrency(totalExpenses)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mb-6 flex flex-col items-end gap-4 sm:flex-row">
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel className="sr-only">Descrição</FormLabel>
                          <FormControl>
                              <Input placeholder="ex: Café, Aluguel" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel className="sr-only">Valor</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="Valor" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                           <FormLabel className="sr-only">Categoria</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {expenseCategories.map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
                <Button type="submit" className="w-full sm:w-auto flex-shrink-0">
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Button>
            </form>
        </Form>
        <ScrollArea className="h-64 pr-4">
          <div className="space-y-4">
            {expenses.length > 0 ? (
              expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between rounded-md bg-secondary p-3">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{expense.category}</Badge>
                    <div>
                      <p className="font-medium">{expense.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(expense.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDeleteExpense(expense.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>Nenhuma despesa registrada para este mês.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
