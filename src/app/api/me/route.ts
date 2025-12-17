import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for validating financial data updates
const financialDataSchema = z.object({
    salaryAmount: z.number().positive(),
    salaryFrequency: z.enum(['hourly', 'daily', 'monthly_business_days', 'monthly', 'monthly_work_hours']),
    bankBalance: z.number().nonnegative(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    breakStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
    breakEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional().nullable(),
    hoursPerDay: z.number().positive().max(24),
    workDays: z.array(z.number().min(0).max(6)),
    totalWorkHoursInMonth: z.number().nonnegative(),
});

/**
 * GET /api/me
 * Returns the current user's data including financial settings
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: {
                financialData: true,
                investments: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            financialData: user.financialData,
            investments: user.investments,
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/me
 * Updates the current user's financial data
 */
export async function PUT(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = financialDataSchema.parse(body);

        const financialData = await prisma.financialData.upsert({
            where: { userId: session.user.id },
            update: {
                salaryAmount: validatedData.salaryAmount,
                salaryFrequency: validatedData.salaryFrequency,
                bankBalance: validatedData.bankBalance,
                startTime: validatedData.startTime,
                endTime: validatedData.endTime,
                breakStartTime: validatedData.breakStartTime,
                breakEndTime: validatedData.breakEndTime,
                hoursPerDay: validatedData.hoursPerDay,
                workDays: validatedData.workDays,
                totalWorkHoursInMonth: validatedData.totalWorkHoursInMonth,
            },
            create: {
                userId: session.user.id,
                salaryAmount: validatedData.salaryAmount,
                salaryFrequency: validatedData.salaryFrequency,
                bankBalance: validatedData.bankBalance,
                startTime: validatedData.startTime,
                endTime: validatedData.endTime,
                breakStartTime: validatedData.breakStartTime,
                breakEndTime: validatedData.breakEndTime,
                hoursPerDay: validatedData.hoursPerDay,
                workDays: validatedData.workDays,
                totalWorkHoursInMonth: validatedData.totalWorkHoursInMonth,
            },
        });

        return NextResponse.json(financialData);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
        }
        console.error('Error updating financial data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
