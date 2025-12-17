import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Schema for reordering transactions
const reorderSchema = z.array(z.object({
    id: z.string(),
    sortIndex: z.number(),
    balanceBefore: z.number(),
}));

/**
 * POST /api/transactions/reorder
 * Batch update transaction sort orders and balance history
 */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const validatedData = reorderSchema.parse(body);

        // Verify all transactions belong to user
        const transactionIds = validatedData.map(t => t.id);
        const existingCount = await prisma.transaction.count({
            where: {
                id: { in: transactionIds },
                userId: session.user.id,
            },
        });

        if (existingCount !== transactionIds.length) {
            return NextResponse.json({ error: 'Some transactions not found' }, { status: 404 });
        }

        // Batch update
        await prisma.$transaction(
            validatedData.map(item =>
                prisma.transaction.update({
                    where: { id: item.id },
                    data: {
                        sortIndex: item.sortIndex,
                        balanceBefore: item.balanceBefore,
                    },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
        }
        console.error('Error reordering transactions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
