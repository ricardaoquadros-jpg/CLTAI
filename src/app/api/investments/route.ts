import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating an investment
const createInvestmentSchema = z.object({
    description: z.string().min(1),
    amount: z.number().positive(),
    date: z.string().datetime(),
    annualYield: z.number().nonnegative(),
    yieldOnBusinessDaysOnly: z.boolean().default(false),
});

/**
 * GET /api/investments
 * Returns all investments for the current user
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const investments = await prisma.investment.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(investments);
    } catch (error) {
        console.error('Error fetching investments:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/investments
 * Creates a new investment for the current user
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createInvestmentSchema.parse(body);

        const investment = await prisma.investment.create({
            data: {
                userId: session.user.id,
                description: validatedData.description,
                amount: validatedData.amount,
                date: new Date(validatedData.date),
                annualYield: validatedData.annualYield,
                yieldOnBusinessDaysOnly: validatedData.yieldOnBusinessDaysOnly,
            },
        });

        return NextResponse.json(investment, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
        }
        console.error('Error creating investment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
