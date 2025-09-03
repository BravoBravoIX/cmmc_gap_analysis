import { NextRequest, NextResponse } from 'next/server';
import { getFileSystemManager } from '@/lib/fileUtils';

const fsm = getFileSystemManager();

// Calculate progress from responses
function calculateProgress(responses: Record<string, any>, totalQuestions: number = 0) {
  const answeredQuestions = Object.values(responses).filter(
    (response: any) => response && response.answer && response.answer !== 'unsure'
  ).length;

  const completionPercentage = totalQuestions > 0 
    ? Math.round((answeredQuestions / totalQuestions) * 100)
    : answeredQuestions > 0 ? Math.round((answeredQuestions / Math.max(Object.keys(responses).length, 1)) * 100) : 0;

  return {
    totalQuestions: Math.max(totalQuestions, Object.keys(responses).length),
    answeredQuestions,
    completionPercentage,
    currentDomain: 0,
    currentQuestion: 0,
    domains: {}
  };
}

// POST /api/assessments/[id]/response - Save individual answer
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { questionId, answer } = await request.json();
    
    if (!questionId || !answer) {
      return NextResponse.json({ error: 'Missing questionId or answer' }, { status: 400 });
    }

    // Load existing session
    const session = await fsm.loadSession(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Enhanced response structure matching reference template
    const responseData = {
      controlId: answer.controlId || questionId,
      domain: answer.domain || questionId.split('.')[0],
      question: answer.question || '',
      answer: answer.answer,
      confidence: answer.confidence || 'medium',
      notes: answer.notes || '',
      evidence: answer.evidence || [],
      followUpCompleted: answer.followUpCompleted || false,
      followUpResponses: answer.followUpResponses || {},
      requiresHomework: answer.requiresHomework || false,
      homeworkAssigned: answer.homeworkAssigned || null,
      remediation: answer.remediation || null,
      timestamp: new Date().toISOString(),
      answeredBy: answer.answeredBy || 'consultant',
      questionId
    };

    // Update session responses
    session.responses[questionId] = responseData;
    
    // Recalculate progress
    session.progress = calculateProgress(session.responses, session.progress?.totalQuestions);
    session.updatedAt = new Date().toISOString();
    
    // Save session
    await fsm.saveSession(session);
    
    return NextResponse.json({ 
      success: true, 
      progress: session.progress 
    });
  } catch (error) {
    console.error('Failed to save response:', error);
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
  }
}

// GET /api/assessments/[id]/response/[questionId] - Get specific response
export async function GET(
  request: NextRequest, 
  { params }: { params: { id: string; questionId?: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    
    if (!questionId) {
      return NextResponse.json({ error: 'Missing questionId parameter' }, { status: 400 });
    }

    const session = await fsm.loadSession(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    const response = session.responses[questionId];
    if (!response) {
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Failed to load response:', error);
    return NextResponse.json({ error: 'Failed to load response' }, { status: 500 });
  }
}