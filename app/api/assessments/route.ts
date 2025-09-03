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

    // Create comprehensive session structure matching reference template
    const session: Session = {
      id: sessionId,
      clientId,
      frameworkId,
      mode: mode as 'quick' | 'detailed',
      status: 'in-progress',
      createdAt: now,
      updatedAt: now,
      startedAt: now,
      completedAt: null,
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
      },
      statistics: {
        totalControls: 0,
        assessed: 0,
        remaining: 0,
        results: {
          yes: 0,
          partial: 0,
          no: 0,
          unsure: 0,
          notApplicable: 0,
          notAssessed: 0
        },
        byDomain: {},
        score: {
          current: 0,
          projected: 0,
          confidence: 'low'
        },
        criticalFindings: []
      },
      homework: [],
      session: {
        duration: 0,
        startTime: now,
        endTime: null,
        pauseEvents: [],
        completionPercentage: 0
      },
      signatures: {
        consultant: {
          name: '',
          date: null,
          signed: false
        },
        client: {
          name: '',
          title: '',
          date: null,
          signed: false
        }
      },
      metadata: {
        version: '1.0',
        tool: 'CMMC Gap Analysis Tool',
        toolVersion: '1.0.0'
      }
    };

    await fsm.saveSession(session);
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create assessment:', error);
    return NextResponse.json({ error: 'Failed to create assessment' }, { status: 500 });
  }
}