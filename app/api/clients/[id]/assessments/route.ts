import { NextRequest, NextResponse } from 'next/server';
import { getFileSystemManager } from '@/lib/fileUtils';

const fsm = getFileSystemManager();

// GET /api/clients/[id]/assessments - List client assessments
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify client exists
    const client = await fsm.loadClient(params.id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const sessions = await fsm.listClientSessions(params.id);
    return NextResponse.json(sessions);
  } catch (error) {
    console.error('Failed to load client assessments:', error);
    return NextResponse.json({ error: 'Failed to load assessments' }, { status: 500 });
  }
}