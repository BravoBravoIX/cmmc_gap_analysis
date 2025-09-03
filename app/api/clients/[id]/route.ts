import { NextRequest, NextResponse } from 'next/server';
import { getFileSystemManager } from '@/lib/fileUtils';

const fsm = getFileSystemManager();

// GET /api/clients/[id] - Get specific client
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const client = await fsm.loadClient(params.id);
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error('Failed to load client:', error);
    return NextResponse.json({ error: 'Failed to load client' }, { status: 500 });
  }
}

// PUT /api/clients/[id] - Update specific client
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json();
    
    // Load existing client
    const existingClient = await fsm.loadClient(params.id);
    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Merge updates with existing data
    const updatedClient = {
      ...existingClient,
      ...updates,
      id: params.id, // Ensure ID cannot be changed
      updatedAt: new Date().toISOString()
    };

    await fsm.saveClient(updatedClient);
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Failed to update client:', error);
    return NextResponse.json({ error: 'Failed to update client' }, { status: 500 });
  }
}

// DELETE /api/clients/[id] - Delete specific client
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if client exists
    const client = await fsm.loadClient(params.id);
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    await fsm.deleteClient(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete client:', error);
    return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 });
  }
}