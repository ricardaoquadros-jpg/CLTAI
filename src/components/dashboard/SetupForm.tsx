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
  incomeAmount: z.coerce.number().positive({ message: 'Please enter a positive amount.' }),
  incomeFrequency: z.enum(['hourly', 'daily', 'monthly_business_days', 'monthly']),
  bankBalance: z.coerce.number().nonnegative({ message: 'Balance cannot be negative.' }),
  investments: z.coerce.number().nonnegative({ message: 'Investment cannot be negative.' }),
});

interface SetupFormProps {
  onSetupComplete: (data: FinancialData) => void;
}

export function SetupForm({ onSetupComplete }: SetupFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      incomeAmount: 1000,
      incomeFrequency: 'monthly',
      bankBalance: 0,
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
          <CardTitle className="font-headline text-2xl">Initial Setup</CardTitle>
          <CardDescription>
            Let&apos;s get started by entering your current financial information.
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
                      <FormLabel>Income Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000" {...field} />
                      </FormControl>
                      <FormDescription>Your income before taxes.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="incomeFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Income Frequency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select how often you get paid" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="monthly_business_days">Monthly (Business Days)</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="hourly">Hourly</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>How often you receive this income.</FormDescription>
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
                    <FormLabel>Current Bank Balance</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10000" {...field} />
                    </FormControl>
                    <FormDescription>The total amount you have in your bank accounts.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="investments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Investments</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="25000" {...field} />
                    </FormControl>
                    <FormDescription>The total value of all your investments.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" size="lg" className="w-full">
                Go to Dashboard
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
