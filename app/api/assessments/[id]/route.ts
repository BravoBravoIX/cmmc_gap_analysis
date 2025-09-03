import { NextRequest, NextResponse } from 'next/server';
import { getFileSystemManager } from '@/lib/fileUtils';

const fsm = getFileSystemManager();

// GET /api/assessments/[id] - Get specific assessment
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await fsm.loadSession(params.id);
    
    if (!session) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }
    
    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to load assessment:', error);
    return NextResponse.json({ error: 'Failed to load assessment' }, { status: 500 });
  }
}

// PUT /api/assessments/[id] - Update assessment
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json();
    
    // Load existing session
    const existingSession = await fsm.loadSession(params.id);
    if (!existingSession) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Merge updates with existing data
    const updatedSession = {
      ...existingSession,
      ...updates,
      id: params.id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString()
    };

    await fsm.saveSession(updatedSession);
    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Failed to update assessment:', error);
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
  }
}

// DELETE /api/assessments/[id] - Delete assessment
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if session exists
    const session = await fsm.loadSession(params.id);
    if (!session) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    await fsm.deleteSession(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete assessment:', error);
    return NextResponse.json({ error: 'Failed to delete assessment' }, { status: 500 });
  }
}