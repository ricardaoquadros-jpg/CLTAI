
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { Expense, ExpenseCategory } from '@/lib/types';
import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';


const expenseCategories: ExpenseCategory[] = ['Lazer', 'Mercado', 'Investimento', 'Transporte', 'Saúde', 'Educação', 'Moradia', 'Outros'];

const formSchema = z.object({
  description: z.string().min(2, { message: 'A descrição deve ter pelo menos 2 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'Por favor, insira um valor positivo.' }),
  category: z.enum(expenseCategories, { required_error: 'Por favor, selecione uma categoria.' }),
});

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  onUpdateExpense: (id: string, expense: Omit<Expense, 'id' | 'date'>) => void;
  onDeleteExpense: (id: string) => void;
  className?: string;
}

export function ExpenseTracker({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense, className }: ExpenseTrackerProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: undefined,
      category: 'Outros',
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (editingExpense) {
      editForm.reset({
        description: editingExpense.description,
        amount: editingExpense.amount,
        category: editingExpense.category,
      });
    }
  }, [editingExpense, editForm]);

  function onAddSubmit(values: z.infer<typeof formSchema>) {
    onAddExpense(values);
    form.reset({ description: '', amount: undefined, category: 'Outros' });
  }

  function onEditSubmit(values: z.infer<typeof formSchema>) {
    if (editingExpense) {
      onUpdateExpense(editingExpense.id, values);
      setIsEditDialogOpen(false);
      setEditingExpense(null);
    }
  }

  const handleEditClick = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditDialogOpen(true);
  };
  
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <Card className={cn("col-span-1 md:col-span-2 bg-[#1d2630]", className)}>
      <CardHeader>
        <CardTitle>Controle de Despesas</CardTitle>
        <CardDescription>Registre e visualize suas despesas para este mês. Total: {formatCurrency(totalExpenses)}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="mb-6 flex flex-col items-end gap-4 sm:flex-row">
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
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                              R$
                            </span>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Valor"
                                className="pl-10"
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value === '' ? undefined : Number(value));
                                }}
                              />
                            </FormControl>
                          </div>
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
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{formatCurrency(expense.amount)}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditClick(expense)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
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

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Despesa</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
