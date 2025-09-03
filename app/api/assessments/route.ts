import { NextRequest, NextResponse } from 'next/server';
import { getFileSystemManager } from '@/lib/fileUtils';
import { Session } from '@/lib/types';

const fsm = getFileSystemManager();

// POST /api/assessments - Create new assessment
export async function POST(request: NextRequest) {
  try {
    const { clientId, frameworkId, mode = 'detailed' } = await request.json();
    
    // Verify client exists
    const client = await fsm.loadClient(clientId);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Generate session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Create new session
    const session: Session = {
      id: sessionId,
      clientId,
      frameworkId,
      mode: mode as 'quick' | 'detailed',
      status: 'in-progress',
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      currentDomain: 0,
      currentQuestion: 0,
      responses: {},
      progress: {
        totalQuestions: 0,
        answeredQuestions: 0,
        completionPercentage: 0,
        currentDomain: 0,
        currentQuestion: 0,
        domains: {}
      }
    };

    await fsm.saveSession(session);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create assessment:', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}