import { NextRequest, NextResponse } from 'next/server';
import { reportExporter, ExportFormat, ReportType } from '@/lib/reportExport';
import { getFileSystemManager } from '@/lib/fileUtils';

const fsm = getFileSystemManager();

export async function POST(request: NextRequest) {
  try {
    const { reportType, format, sessionId } = await request.json();

    if (!reportType || !format || !sessionId) {
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

    const options = {
      reportType: reportType as ReportType,
      format: format as ExportFormat,
      session: sessionData,
      client: clientData
    };

    const buffer = await reportExporter.exportReport(options);
    const fileName = reportExporter.getFileName(options);

    const mimeType = format === 'pdf' 
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}