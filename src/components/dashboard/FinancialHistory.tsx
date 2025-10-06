
'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { Transaction, ExpenseCategory, TransactionType } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { ptBR } from "date-fns/locale";

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { formatCurrency } from '@/lib/utils';
import { PlusCircle, Trash2, Pencil, CalendarDays, ArrowDownCircle, ArrowUpCircle, ArrowDown, ArrowUp, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';


const expenseCategories: ExpenseCategory[] = ['Lazer', 'Mercado', 'Investimento', 'Transporte', 'Saúde', 'Educação', 'Moradia', 'Jogos', 'Esportes', 'Outros'];
const transactionTypes: {label: string, value: TransactionType}[] = [{label: 'Entrada', value: 'income'}, {label: 'Saída', value: 'expense'}];

const formSchema = z.object({
  description: z.string().min(2, { message: 'A descrição deve ter pelo menos 2 caracteres.' }),
  amount: z.coerce.number().positive({ message: 'Por favor, insira um valor positivo.' }),
  category: z.enum(expenseCategories, { required_error: 'Por favor, selecione uma categoria.' }),
  date: z.date({ required_error: "A data é obrigatória." }),
  type: z.enum(['income', 'expense'], { required_error: "O tipo é obrigatório." }),
});

interface FinancialHistoryProps {
  transactions: Transaction[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'balanceBefore' | 'userId' | 'createdAt' | 'sortIndex'>) => void;
  onUpdateTransaction: (id: string, transaction: Partial<Omit<Transaction, 'id' | 'balanceBefore' | 'userId'>>) => void;
  onDeleteTransaction: (id: string) => void;
  onReorderTransactions: (reorderedTransactions: Transaction[]) => void;
  className?: string;
}

export function FinancialHistory({ transactions: initialTransactions, onAddTransaction, onUpdateTransaction, onDeleteTransaction, onReorderTransactions, className }: FinancialHistoryProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // Reverse for descending display order, but keep "Saldo Inicial" logic separate
    const initialBalance = initialTransactions.find(t => t.description === 'Saldo Inicial');
    const otherTransactions = initialTransactions
      .filter(t => t.description !== 'Saldo Inicial')
      .reverse(); 
    
    const sortedForDisplay = initialBalance ? [...otherTransactions, initialBalance] : otherTransactions;

    setLocalTransactions(sortedForDisplay);
  }, [initialTransactions]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: '',
      amount: undefined,
      category: 'Outros',
      date: new Date(),
      type: 'expense'
    },
  });

  const editForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (editingTransaction) {
      editForm.reset({
        description: editingTransaction.description,
        amount: editingTransaction.amount,
        category: editingTransaction.category,
        date: new Date(editingTransaction.date),
        type: editingTransaction.type,
      });
    }
  }, [editingTransaction, editForm]);

  function onAddSubmit(values: z.infer<typeof formSchema>) {
    onAddTransaction({ ...values, date: values.date.toISOString() });
    form.reset({ description: '', amount: undefined, category: 'Outros', date: new Date(), type: 'expense' });
  }

  function onEditSubmit(values: z.infer<typeof formSchema>) {
    if (editingTransaction) {
      onUpdateTransaction(editingTransaction.id, {
        ...values,
        date: values.date.toISOString()
      });
      setIsEditDialogOpen(false);
      setEditingTransaction(null);
    }
  }

  const handleEditClick = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditDialogOpen(true);
  };
  
  const moveTransaction = (index: number, direction: 'up' | 'down') => {
    const newTransactions = [...localTransactions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newTransactions.length) return;
  
    // Swap elements
    [newTransactions[index], newTransactions[targetIndex]] = [newTransactions[targetIndex], newTransactions[index]];
  
    setLocalTransactions(newTransactions);
    setIsDirty(true);
  };

  const handleUpdateOrder = () => {
    // Reverse the list back to chronological order for saving, excluding "Saldo Inicial"
    const initialBalance = localTransactions.find(t => t.description === 'Saldo Inicial');
    const transactionsToSave = localTransactions
        .filter(t => t.description !== 'Saldo Inicial')
        .reverse();

    const finalSaveOrder = initialBalance ? [initialBalance, ...transactionsToSave] : transactionsToSave;

    onReorderTransactions(finalSaveOrder);
    setIsDirty(false);
};

  const isMoveUpDisabled = (index: number) => {
    if (index === 0) return true;
    const currentTx = localTransactions[index];
    const previousTx = localTransactions[index - 1];
    return !isSameDay(new Date(currentTx.date), new Date(previousTx.date)) || previousTx.description === 'Saldo Inicial';
  };
  
  const isMoveDownDisabled = (index: number) => {
    const currentTx = localTransactions[index];
    if (index === localTransactions.length - 1 || currentTx.description === 'Saldo Inicial') return true;
    const nextTx = localTransactions[index + 1];
    return !isSameDay(new Date(currentTx.date), new Date(nextTx.date));
  };
  

  return (
    <Card className={cn("col-span-1 md:col-span-2 bg-[#1d2630]", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Histórico Financeiro</CardTitle>
            <CardDescription>Registre e visualize suas transações financeiras.</CardDescription>
          </div>
           <Button onClick={handleUpdateOrder} size="sm">
              <RefreshCcw className="mr-2 h-4 w-4" />
              Atualizar Saldos
           </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="mb-6 space-y-4">
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="flex justify-center">
                            <FormControl>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                    className="gap-0"
                                >
                                    <ToggleGroupItem value="expense" aria-label="Toggle expense" className="rounded-r-none">
                                        <ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />
                                        Saída
                                    </ToggleGroupItem>
                                    <ToggleGroupItem value="income" aria-label="Toggle income" className="rounded-l-none">
                                        <ArrowUpCircle className="mr-2 h-4 w-4 text-green-500" />
                                        Entrada
                                    </ToggleGroupItem>
                                </ToggleGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                              <Input placeholder="ex: Salário, Aluguel" {...field} />
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
                          <FormLabel>Valor</FormLabel>
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
                </div>
                 <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                     <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                           <FormLabel>Categoria</FormLabel>
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
                     <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Data da Operação</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className="pl-3 text-left font-normal">
                                                {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                                <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" className="w-full sm:w-auto float-right">
                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar
                </Button>
            </form>
        </Form>
        <ScrollArea className="h-96 pr-4 pt-10">
          <div className="space-y-4">
            {localTransactions.length > 0 ? (
              localTransactions.map((transaction, index) => {
                const isInitialBalance = transaction.description === 'Saldo Inicial';
                return (
                  <div key={transaction.id} className="flex items-center justify-between rounded-md bg-secondary p-3">
                    <div className="flex items-center gap-3">
                       <div className="flex flex-col items-center">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveTransaction(index, 'up')} disabled={isMoveUpDisabled(index)}>
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveTransaction(index, 'down')} disabled={isMoveDownDisabled(index)}>
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      {transaction.type === 'income' ? 
                          <ArrowUpCircle className="h-5 w-5 text-green-500 flex-shrink-0" /> : 
                          <ArrowDownCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      }
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        {!isInitialBalance && (
                          <>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(transaction.date), "dd/MM/yyyy")}
                            </p>
                            <Badge variant="outline" className="mt-1">{transaction.category}</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      <div>
                        <p className={`font-semibold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                            {transaction.type === 'income' ? '+' : '-'} {formatCurrency(transaction.amount)}
                        </p>
                        {!isInitialBalance && (
                           <p className="text-xs text-muted-foreground">
                              Saldo anterior: {formatCurrency(transaction.balanceBefore)}
                           </p>
                        )}
                      </div>
                      {!isInitialBalance && (
                        <>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => handleEditClick(transaction)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDeleteTransaction(transaction.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <p>Nenhuma transação registrada.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                 <FormField
                    control={editForm.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem className="flex justify-center">
                            <FormControl>
                                <ToggleGroup
                                    type="single"
                                    variant="outline"
                                    value={field.value}
                                    onValueChange={field.onChange}
                                >
                                    <ToggleGroupItem value="expense"><ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />Saída</ToggleGroupItem>
                                    <ToggleGroupItem value="income"><ArrowUpCircle className="mr-2 h-4 w-4 text-green-500" />Entrada</ToggleGroupItem>
                                </ToggleGroup>
                            </FormControl>
                        </FormItem>
                    )}
                />
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
              <FormField
                control={editForm.control}
                name="date"
                render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Data da Operação</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                                <FormControl>
                                    <Button variant="outline" className="pl-3 text-left font-normal">
                                        {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                        <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
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
