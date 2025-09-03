import { NextRequest, NextResponse } from 'next/server';
import { getFileSystemManager } from '@/lib/fileUtils';

const fsm = getFileSystemManager();

// GET /api/clients - List all clients
export async function GET() {
  try {
    const clients = await fsm.listClients();
    return NextResponse.json(clients);
  } catch (error) {
    console.error('Failed to load clients:', error);
    return NextResponse.json({ error: 'Failed to load clients' }, { status: 500 });
  }
}

// POST /api/clients - Create new client
export async function POST(request: NextRequest) {
  try {
    const inputData = await request.json();
    
    // Transform flat input to comprehensive Client structure matching reference template
    const clientData = {
      id: inputData.id || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      companyName: inputData.companyName,
      dba: inputData.dba || '',
      industry: inputData.industry,
      logo: inputData.logo,
      size: {
        employees: inputData.companySize === 'small' ? 50 : 
                  inputData.companySize === 'medium' ? 500 :
                  inputData.companySize === 'large' ? 5000 : 100,
        revenue: inputData.companySize === 'small' ? 'Under $10M' : 
                inputData.companySize === 'medium' ? '$10M - $100M' :
                inputData.companySize === 'large' ? 'Over $100M' : 'Not specified',
        locations: inputData.locations || 1
      },
      contact: {
        primary: {
          name: inputData.contactName,
          email: inputData.contactEmail,
          phone: inputData.contactPhone || '',
          title: inputData.contactTitle || 'Primary Contact'
        },
        technical: {
          name: inputData.technicalContactName || '',
          email: inputData.technicalContactEmail || '',
          phone: inputData.technicalContactPhone || '',
          title: inputData.technicalContactTitle || ''
        },
        executive: {
          name: inputData.executiveContactName || '',
          email: inputData.executiveContactEmail || '',
          phone: inputData.executiveContactPhone || '',
          title: inputData.executiveContactTitle || ''
        }
      },
      address: {
        street1: inputData.street1 || '',
        street2: inputData.street2 || '',
        city: inputData.city || '',
        state: inputData.state || '',
        zip: inputData.zip || '',
        country: inputData.country || 'USA'
      },
      contracts: {
        hasFederalContracts: inputData.hasGovernmentContracts || false,
        contractTypes: inputData.contractTypes || [],
        primeOrSub: inputData.primeOrSub || '',
        agencies: inputData.agencies || [],
        handlesCUI: inputData.handlesCUI || false,
        handlesFCI: inputData.handlesFCI || false
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await fsm.saveClient(clientData);
    return NextResponse.json(clientData, { status: 201 });
  } catch (error) {
    console.error('Failed to create client:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}