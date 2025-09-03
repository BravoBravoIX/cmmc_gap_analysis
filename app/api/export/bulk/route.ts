import { NextRequest, NextResponse } from 'next/server';
import { reportExporter, ReportType, ExportFormat } from '@/lib/reportExport';
import { getFileSystemManager } from '@/lib/fileUtils';

const fsm = getFileSystemManager();

export async function POST(request: NextRequest) {
  try {
    const { format, sessionId, reportTypes } = await request.json();

    if (!format || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Load session data from file system
    const sessionData = await fsm.loadSession(sessionId);
    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Load client data from file system
    const clientData = await fsm.loadClient(sessionData.clientId);
    if (!clientData) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Dynamic import of JSZip
    const JSZip = await import('jszip');
    const zip = new JSZip.default();
    const reportsToExport: ReportType[] = reportTypes || [
      'executive', 
      'technical', 
      'homework', 
      'progress', 
      'certification'
    ];

    // Generate all requested reports
    for (const reportType of reportsToExport) {
      try {
        const options = {
          reportType,
          format: format as ExportFormat,
          session: sessionData,
          client: clientData
        };

        const buffer = await reportExporter.exportReport(options);
        const fileName = reportExporter.getFileName(options);
        
        zip.file(fileName, buffer);
      } catch (error) {
        console.error(`Failed to generate ${reportType} report:`, error);
        // Continue with other reports even if one fails
      }
    }

    // Generate ZIP file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    const timestamp = new Date().toISOString().split('T')[0];
    const zipFileName = `${clientData.companyName}_CMMC_Reports_${timestamp}.zip`;

    return new NextResponse(zipBuffer as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Bulk export API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report bundle' },
      { status: 500 }
    );
  }
}