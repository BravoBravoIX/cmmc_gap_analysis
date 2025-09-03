import { NextRequest, NextResponse } from 'next/server';
import { getFileSystemManager } from '@/lib/fileUtils';
import archiver from 'archiver';
import { Readable } from 'stream';

const fsm = getFileSystemManager();

export async function POST(request: NextRequest) {
  try {
    // Get all clients directly from file system
    const clients = await fsm.listClients();
    
    if (clients.length === 0) {
      return NextResponse.json({ error: 'No clients found to export' }, { status: 404 });
    }

    // Create a zip archive
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    // Create readable stream for the response
    const stream = new ReadableStream({
      start(controller) {
        archive.on('data', (chunk) => {
          controller.enqueue(chunk);
        });
        
        archive.on('end', () => {
          controller.close();
        });
        
        archive.on('error', (err) => {
          controller.error(err);
        });
      }
    });

    // Add client data to archive
    for (const client of clients) {
      // Add client profile JSON
      const clientFolder = `clients/${client.companyName.replace(/[^a-zA-Z0-9-_]/g, '_')}_${client.id}`;
      archive.append(JSON.stringify(client, null, 2), { 
        name: `${clientFolder}/profile.json` 
      });

      // Get all assessments for this client
      try {
        const sessions = await fsm.listClientSessions(client.id);
        
        // Add assessments folder  
        for (const session of sessions) {
          try {
            // Create descriptive filename with framework name, date, and status
            const frameworkDisplayName = {
              'cmmc_l1': 'CMMC_Level_1',
              'cmmc_l2': 'CMMC_Level_2', 
              'cmmc_l3': 'CMMC_Level_3'
            }[session.frameworkId] || session.frameworkId || 'Unknown_Framework';
            
            const createdDate = new Date(session.createdAt);
            const dateStr = createdDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            const statusStr = session.status ? session.status.charAt(0).toUpperCase() + session.status.slice(1) : 'Unknown';
            
            // Format: CMMC_Level_1_Assessment_2025-09-03_Completed_session123.json
            const sessionFileName = `${frameworkDisplayName}_Assessment_${dateStr}_${statusStr}_${session.id}.json`;
            
            archive.append(JSON.stringify(session, null, 2), { 
              name: `${clientFolder}/assessments/${sessionFileName}` 
            });
          } catch (error) {
            console.error(`Failed to load session ${session.id}:`, error);
            // Continue with other sessions even if one fails
          }
        }
      } catch (error) {
        console.error(`Failed to load sessions for client ${client.id}:`, error);
        // Continue with other clients even if sessions fail
      }
    }

    // Add a metadata file
    const metadata = {
      exportDate: new Date().toISOString(),
      totalClients: clients.length,
      exportedBy: 'CMMC Gap Analysis Tool',
      version: '1.0',
      structure: {
        description: 'Each client has a folder with their profile.json and assessments subfolder',
        clientFolder: 'clients/{ClientName}_{ClientID}/',
        profileFile: 'profile.json',
        assessmentsFolder: 'assessments/',
        assessmentFile: '{FrameworkName}_Assessment_{Date}_{Status}_{SessionID}.json',
        example: 'CMMC_Level_1_Assessment_2025-09-03_Completed_session123.json'
      }
    };

    archive.append(JSON.stringify(metadata, null, 2), { name: 'export_metadata.json' });

    // Finalize the archive
    archive.finalize();

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `CMMC_All_Clients_Export_${timestamp}.zip`;

    // Return the zip file
    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Bulk export failed:', error);
    return NextResponse.json({ 
      error: 'Failed to export client data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}