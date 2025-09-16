'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { FinancialData } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  incomeAmount: z.coerce.number().positive({ message: 'Por favor, insira um valor positivo.' }),
  incomeFrequency: z.enum(['hourly', 'daily', 'monthly_business_days', 'monthly']),
  bankBalance: z.coerce.number().nonnegative({ message: 'O saldo não pode ser negativo.' }),
  investments: z.coerce.number().nonnegative({ message: 'O investimento não pode ser negativo.' }),
});

interface SetupFormProps {
  onSetupComplete: (data: FinancialData) => void;
}

export function SetupForm({ onSetupComplete }: SetupFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      incomeAmount: 5000,
      incomeFrequency: 'monthly',
      bankBalance: 1000,
      investments: 0,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onSetupComplete({
      income: {
        amount: values.incomeAmount,
        frequency: values.incomeFrequency as FinancialData['income']['frequency'],
      },
      bankBalance: values.bankBalance,
      investments: values.investments,
    });
  }

  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Configuração Inicial</CardTitle>
          <CardDescription>
            Vamos começar inserindo suas informações financeiras atuais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="incomeAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor da Renda</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000" {...field} />
                      </FormControl>
                      <FormDescription>Sua renda antes dos impostos.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incomeFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência da Renda</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência do pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="monthly_business_days">Mensal (Dias Úteis)</SelectItem>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="hourly">Por Hora</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Com que frequência você recebe essa renda.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="bankBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Saldo Bancário Atual</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10000" {...field} />
                    </FormControl>
                    <FormDescription>O valor total que você tem em suas contas bancárias.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total de Investimentos</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25000" {...field} />
                    </FormControl>
                    <FormDescription>O valor total de todos os seus investimentos.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full">
                Ir para o Painel
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
