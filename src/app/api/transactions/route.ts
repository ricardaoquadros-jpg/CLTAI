import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for creating a transaction
const createTransactionSchema = z.object({
    description: z.string().min(1),
    amount: z.number().positive(),
    date: z.string().datetime(),
    type: z.enum(['income', 'expense']),
    category: z.enum([
        'Alimentação', 'Lazer', 'Mercado', 'Investimento', 'Transporte',
        'Saúde', 'Educação', 'Moradia', 'Jogos', 'Esportes', 'Roupas', 'Outros'
    ]),
    balanceBefore: z.number(),
    sortIndex: z.number().optional(),
});

/**
 * GET /api/transactions
 * Returns all transactions for the current user
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const transactions = await prisma.transaction.findMany({
            where: { userId: session.user.id },
            orderBy: [
                { date: 'asc' },
                { sortIndex: 'asc' },
                { createdAt: 'asc' },
            ],
        });

        return NextResponse.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/transactions
 * Creates a new transaction for the current user
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = createTransactionSchema.parse(body);

        const transaction = await prisma.transaction.create({
            data: {
                userId: session.user.id,
                description: validatedData.description,
                amount: validatedData.amount,
                date: new Date(validatedData.date),
                type: validatedData.type,
                category: validatedData.category,
                balanceBefore: validatedData.balanceBefore,
                sortIndex: validatedData.sortIndex ?? Date.now(),
            },
        });

        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
        }
        console.error('Error creating transaction:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
