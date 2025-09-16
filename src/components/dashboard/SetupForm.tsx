'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { FinancialData } from '@/lib/types';
import { ptBR } from "date-fns/locale"
import React, { useState, useEffect, useMemo } from 'react';
import { startOfMonth, isSameDay, parse } from 'date-fns';

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
import { Calendar } from "@/components/ui/calendar";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Separator } from '../ui/separator';
import { CalendarDays, Clock } from 'lucide-react';


const formSchema = z.object({
  salaryAmount: z.coerce.number().positive({ message: 'Por favor, insira um valor positivo.' }),
  salaryFrequency: z.enum(['hourly', 'daily', 'monthly_business_days', 'monthly', 'monthly_work_hours']),
  bankBalance: z.coerce.number().nonnegative({ message: 'O saldo não pode ser negativo.' }),
  investments: z.coerce.number().nonnegative({ message: 'O investimento não pode ser negativo.' }),
  workStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato de hora inválido. Use HH:mm." }),
  workEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: "Formato de hora inválido. Use HH:mm." }),
   workDays: z.array(z.number()).min(1, { message: "Você precisa selecionar pelo menos um dia de trabalho." }),
});

const weekDaysMap = [
    { label: "D", value: "0" }, // Domingo
    { label: "S", value: "1" }, // Segunda
    { label: "T", value: "2" }, // Terça
    { label: "Q", value: "3" }, // Quarta
    { label: "Q", value: "4" }, // Quinta
    { label: "S", value: "5" }, // Sexta
    { label: "S", value: "6" }, // Sábado
] as const;

interface SetupFormProps {
  onSetupComplete: (data: FinancialData) => void;
}

export function SetupForm({ onSetupComplete }: SetupFormProps) {
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      salaryAmount: 5000,
      salaryFrequency: 'monthly',
      bankBalance: 1000,
      investments: 0,
      workStartTime: '09:00',
      workEndTime: '18:00',
      workDays: ["1", "2", "3", "4", "5"].map(Number), // Default to Mon-Fri
    },
  });

  const selectedWeekDays = form.watch('workDays');
  const workStartTime = form.watch('workStartTime');
  const workEndTime = form.watch('workEndTime');

  useEffect(() => {
    const dates: Date[] = [];
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    if(selectedWeekDays && selectedWeekDays.length > 0) {
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            if (selectedWeekDays.includes(date.getDay())) {
                dates.push(date);
            }
        }
    }
    setSelectedDates(dates);
  }, [selectedWeekDays]);

  const handleCalendarSelect = (day: Date | undefined) => {
    if (!day) return;

    setSelectedDates(prevSelectedDates => {
      const isAlreadySelected = prevSelectedDates.some(selectedDay => isSameDay(selectedDay, day));
      if (isAlreadySelected) {
        return prevSelectedDates.filter(selectedDay => !isSameDay(selectedDay, day));
      } else {
        return [...prevSelectedDates, day];
      }
    });
  };

  const totalWorkHours = useMemo(() => {
    if (!workStartTime || !workEndTime || selectedDates.length === 0) {
      return 0;
    }
    try {
      const start = parse(workStartTime, 'HH:mm', new Date());
      let end = parse(workEndTime, 'HH:mm', new Date());

      if (end < start) { // overnight shift
        end.setDate(end.getDate() + 1);
      }
      
      const diffMs = end.getTime() - start.getTime();
      const hoursPerDay = diffMs / (1000 * 60 * 60);

      return hoursPerDay * selectedDates.length;
    } catch (e) {
      return 0;
    }
  }, [workStartTime, workEndTime, selectedDates]);
  
  function onSubmit(values: z.infer<typeof formSchema>) {
    // We can derive the workdays from the selected dates to be more accurate
    const finalWorkDays = [...new Set(selectedDates.map(d => d.getDay()))].sort();

    onSetupComplete({
      salary: {
        amount: values.salaryAmount,
        frequency: values.salaryFrequency as FinancialData['salary']['frequency'],
      },
      bankBalance: values.bankBalance,
      investments: values.investments,
      workStartTime: values.workStartTime,
      workEndTime: values.workEndTime,
      workDays: finalWorkDays,
      totalWorkHoursInMonth: totalWorkHours,
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
                  name="salaryAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor do Salário</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="5000" {...field} />
                      </FormControl>
                      <FormDescription>Seu salário antes dos impostos.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="salaryFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequência do Salário</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a frequência do pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">
                            <div>
                                <p>Mensal</p>
                                <p className="text-xs text-muted-foreground">O salário é dividido por 30.44 dias.</p>
                            </div>
                          </SelectItem>
                          <SelectItem value="monthly_business_days">
                             <div>
                                <p>Mensal (Dias Úteis)</p>
                                <p className="text-xs text-muted-foreground">O salário é dividido pelos dias de trabalho no mês.</p>
                            </div>
                          </SelectItem>
                          <SelectItem value="monthly_work_hours">
                             <div>
                                <p>Mensal (Horas Trabalhadas)</p>
                                <p className="text-xs text-muted-foreground">O salário é dividido pelo total de horas de trabalho.</p>
                            </div>
                          </SelectItem>
                          <SelectItem value="daily">
                            <div>
                                <p>Diário</p>
                                <p className="text-xs text-muted-foreground">O valor é dividido pelas horas do seu expediente.</p>
                            </div>
                          </SelectItem>
                          <SelectItem value="hourly">
                             <div>
                                <p>Por Hora</p>
                                <p className="text-xs text-muted-foreground">Cálculo direto do valor por hora.</p>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>Com que frequência você recebe seu salário.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="workStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início do Expediente</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>A hora que você começa a trabalhar.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="workEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim do Expediente</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>A hora que você para de trabalhar.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="workDays"
                render={({ field }) => (
                   <FormItem className="flex flex-col items-center">
                    <FormLabel>Dias de Trabalho na Semana</FormLabel>
                    <FormControl>
                       <ToggleGroup
                        type="multiple"
                        variant="outline"
                        value={field.value.map(String)}
                        onValueChange={(value) => {
                            field.onChange(value.map(Number));
                        }}
                        className="gap-2"
                       >
                         {weekDaysMap.map(day => (
                            <ToggleGroupItem key={day.value} value={day.value} aria-label={`Toggle ${day.label}`}>
                                {day.label}
                            </ToggleGroupItem>
                         ))}
                       </ToggleGroup>
                    </FormControl>
                    <FormDescription>
                      Selecione os dias da semana que você trabalha. O calendário abaixo será preenchido automaticamente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <div className="flex flex-col items-center">
                   <FormLabel className="mb-2">Calendário de Trabalho (Mês Atual)</FormLabel>
                   <Calendar
                    mode="multiple"
                    selected={selectedDates}
                    onDayClick={handleCalendarSelect}
                    className="rounded-md border"
                    locale={ptBR}
                    month={startOfMonth(new Date())}
                  />
               </div>
               <Card className="bg-secondary/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Total de dias de trabalho</p>
                      <p className="font-semibold text-lg">{selectedDates.length}</p>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5"><Clock className="h-4 w-4" /> Total de horas de trabalho</p>
                      <p className="font-semibold text-lg">{totalWorkHours.toFixed(2)}</p>
                    </div>
                  </div>
                </CardContent>
               </Card>
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
