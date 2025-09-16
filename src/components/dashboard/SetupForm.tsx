'use client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { FinancialData } from '@/lib/types';
import { ptBR } from "date-fns/locale"
import React, { useState, useEffect, useMemo } from 'react';
import { startOfMonth, isSameDay, differenceInMinutes, parse } from 'date-fns';

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
  salaryFrequency: z.enum(['monthly', 'monthly_work_hours']),
  bankBalance: z.coerce.number().nonnegative({ message: 'O saldo não pode ser negativo.' }),
  investments: z.coerce.number().nonnegative({ message: 'O investimento não pode ser negativo.' }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido. Use HH:MM." }),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido. Use HH:MM." }),
  breakStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido. Use HH:MM." }).optional().or(z.literal('')),
  breakEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Formato de hora inválido. Use HH:MM." }).optional().or(z.literal('')),
  hoursPerDay: z.coerce.number().positive({ message: 'Por favor, insira um valor positivo.' }).max(24, { message: 'As horas não podem exceder 24.'}),
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
      salaryFrequency: 'monthly_work_hours',
      bankBalance: 0,
      investments: 0,
      startTime: '09:00',
      endTime: '18:00',
      breakStartTime: '12:00',
      breakEndTime: '13:00',
      hoursPerDay: 8,
      workDays: ["1", "2", "3", "4", "5"].map(Number), // Default to Mon-Fri
    },
  });

  const selectedWeekDays = form.watch('workDays');
  const hoursPerDay = form.watch('hoursPerDay');
  const startTime = form.watch('startTime');
  const endTime = form.watch('endTime');
  const breakStartTime = form.watch('breakStartTime');
  const breakEndTime = form.watch('breakEndTime');

  useEffect(() => {
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      const startDate = new Date(0, 0, 0, startHour, startMinute);
      const endDate = new Date(0, 0, 0, endHour, endMinute);

      let diff = differenceInMinutes(endDate, startDate);
      if (diff < 0) {
        // handles overnight shifts
        diff += 24 * 60;
      }

      let breakMinutes = 0;
      if (breakStartTime && breakEndTime) {
        const [breakStartHour, breakStartMinute] = breakStartTime.split(':').map(Number);
        const [breakEndHour, breakEndMinute] = breakEndTime.split(':').map(Number);
        const breakStartDate = new Date(0, 0, 0, breakStartHour, breakStartMinute);
        const breakEndDate = new Date(0, 0, 0, breakEndHour, breakEndMinute);
        let breakDiff = differenceInMinutes(breakEndDate, breakStartDate);
        if (breakDiff < 0) breakDiff += 24 * 60;
        breakMinutes = breakDiff;
      }
      
      const totalWorkMinutes = diff - breakMinutes;
      const hours = totalWorkMinutes / 60;

      if (hours > 0 && hours !== hoursPerDay) {
        form.setValue('hoursPerDay', parseFloat(hours.toFixed(2)));
      }
    } catch (e) {
      // Ignore errors from invalid time formats during input
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime, endTime, breakStartTime, breakEndTime, form.setValue]);


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
    if (!hoursPerDay || selectedDates.length === 0) {
      return 0;
    }
    return hoursPerDay * selectedDates.length;
  }, [hoursPerDay, selectedDates]);
  
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
      startTime: values.startTime,
      endTime: values.endTime,
      breakStartTime: values.breakStartTime || undefined,
      breakEndTime: values.breakEndTime || undefined,
      hoursPerDay: values.hoursPerDay,
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
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                          R$
                        </span>
                        <FormControl>
                          <Input type="number" placeholder="5000" className="pl-10" {...field} />
                        </FormControl>
                      </div>
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
                           <SelectItem value="monthly_work_hours">
                             <div>
                                <p>Mensal (Horas Trabalhadas)</p>
                                <p className="text-xs text-muted-foreground">O salário é dividido pelo total de horas de trabalho.</p>
                            </div>
                          </SelectItem>
                          <SelectItem value="monthly">
                            <div>
                                <p>Mensal</p>
                                <p className="text-xs text-muted-foreground">O salário é dividido por 30.44 dias.</p>
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
               <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startTime"
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
                  name="endTime"
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

               <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="breakStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início do Intervalo</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>Opcional. Deixe em branco se não houver intervalo.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="breakEndTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim do Intervalo</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormDescription>Opcional. Deixe em branco se não houver intervalo.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

                <FormField
                  control={form.control}
                  name="hoursPerDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Carga Horária Diária</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="8" {...field} />
                      </FormControl>
                      <FormDescription>Quantas horas você trabalha por dia. Calculado automaticamente.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               <Card className="bg-primary text-primary-foreground">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-1.5"><CalendarDays className="h-4 w-4" /> Total de dias de trabalho</p>
                      <p className="font-semibold text-lg">{selectedDates.length}</p>
                    </div>
                    <Separator className="bg-primary-foreground/20" />
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium flex items-center gap-1.5"><Clock className="h-4 w-4" /> Total de horas de trabalho</p>
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
