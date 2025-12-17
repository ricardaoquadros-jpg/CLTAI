import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for updating a transaction
const updateTransactionSchema = z.object({
    description: z.string().min(1).optional(),
    amount: z.number().positive().optional(),
    date: z.string().datetime().optional(),
    type: z.enum(['income', 'expense']).optional(),
    category: z.enum([
        'Alimentação', 'Lazer', 'Mercado', 'Investimento', 'Transporte',
        'Saúde', 'Educação', 'Moradia', 'Jogos', 'Esportes', 'Roupas', 'Outros'
    ]).optional(),
    balanceBefore: z.number().optional(),
    sortIndex: z.number().optional(),
});

/**
 * GET /api/transactions/[id]
 * Returns a specific transaction
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const transaction = await prisma.transaction.findFirst({
            where: {
                id,
                userId: session.user.id, // Ensure user can only access their own data
            },
        });

        if (!transaction) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/transactions/[id]
 * Updates a specific transaction
 */
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const existing = await prisma.transaction.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        const body = await request.json();
        const validatedData = updateTransactionSchema.parse(body);

        const transaction = await prisma.transaction.update({
            where: { id },
            data: {
                ...(validatedData.description && { description: validatedData.description }),
                ...(validatedData.amount && { amount: validatedData.amount }),
                ...(validatedData.date && { date: new Date(validatedData.date) }),
                ...(validatedData.type && { type: validatedData.type }),
                ...(validatedData.category && { category: validatedData.category }),
                ...(validatedData.balanceBefore !== undefined && { balanceBefore: validatedData.balanceBefore }),
                ...(validatedData.sortIndex !== undefined && { sortIndex: validatedData.sortIndex }),
            },
        });

        return NextResponse.json(transaction);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
        }
        console.error('Error updating transaction:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * DELETE /api/transactions/[id]
 * Deletes a specific transaction
 */
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { id } = await params;

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Verify ownership
        const existing = await prisma.transaction.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
        }

        await prisma.transaction.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
