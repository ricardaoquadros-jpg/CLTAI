import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/investments/[id]
 * Deletes a specific investment
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
        const existing = await prisma.investment.findFirst({
            where: {
                id,
                userId: session.user.id,
            },
        });

        if (!existing) {
            return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
        }

        await prisma.investment.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting investment:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
