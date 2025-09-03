// Import generators dynamically when needed
import { Session, Client } from './types';
import { 
  generateExecutiveSummaryHTML, 
  generateTechnicalFindingsHTML,
  generateHomeworkDocumentHTML,
  generateProgressTrackingHTML,
  generateCertificationReadinessHTML,
  getBaseCSS,
  ReportData
} from './reportTemplates';
import { calculateScore, generateAssessmentReport, getReadinessLevel } from './scoringUtils';
import { getClient } from './clientUtils';

export type ExportFormat = 'pdf' | 'docx';
export type ReportType = 'executive' | 'technical' | 'homework' | 'progress' | 'certification';

export interface ExportOptions {
  reportType: ReportType;
  format: ExportFormat;
  session: Session;
  client: Client;
}

export class ReportExporter {
  private generateHTML(reportType: ReportType, session: Session, client: Client): string {
    const css = getBaseCSS();
    // Create a simplified assessment report for export
    const reportData = this.generateSimpleReport(session);
    const data = {
      report: reportData,
      client,
      framework: { 
        id: session.frameworkId || 'cmmc_l1',
        name: session.frameworkId || 'CMMC', 
        path: '', 
        manifest: {} as any,
        enabled: true,
        totalControls: 0,
        estimatedTime: '0 minutes',
        domains: [],
        color: 'blue'
      } as any,
      generatedDate: new Date().toLocaleDateString()
    };
    
    let content = '';
    switch (reportType) {
      case 'executive':
        content = generateExecutiveSummaryHTML(data);
        break;
      case 'technical':
        content = generateTechnicalFindingsHTML(data);
        break;
      case 'homework':
        content = generateHomeworkDocumentHTML(data);
        break;
      case 'progress':
        content = generateProgressTrackingHTML(data);
        break;
      case 'certification':
        content = generateCertificationReadinessHTML(data);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${this.getReportTitle(reportType)} - ${client.companyName}</title>
          <style>${css}</style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;
  }

  private getReportTitle(reportType: ReportType): string {
    const titles = {
      executive: 'Executive Summary',
      technical: 'Technical Findings',
      homework: 'Homework Assignment',
      progress: 'Progress Report',
      certification: 'Certification Readiness'
    };
    return titles[reportType];
  }

  private generateSimpleReport(session: Session): any {
    // Calculate basic scores from session responses
    const responses = Object.values(session.responses || {});
    const totalQuestions = responses.length;
    const answeredQuestions = responses.filter(r => r.answer && r.answer !== 'skipped').length;
    const yesCount = responses.filter(r => r.answer === 'yes').length;
    const partialCount = responses.filter(r => r.answer === 'partial').length;
    const noCount = responses.filter(r => r.answer === 'no').length;
    
    const rawScore = yesCount + (partialCount * 0.5);
    const percentage = totalQuestions > 0 ? Math.round((rawScore / totalQuestions) * 100) : 0;
    
    return {
      overview: {
        totalQuestions,
        answeredQuestions,
        yesCount,
        partialCount,
        noCount,
        unsureCount: responses.filter(r => r.answer === 'unsure').length,
        skippedCount: responses.filter(r => r.answer === 'skipped').length,
        naCount: responses.filter(r => r.answer === 'na').length,
        rawScore,
        maxPossibleScore: totalQuestions,
        percentage
      },
      domainScores: {},
      criticalFindings: [],
      quickWins: [],
      recommendations: [],
      homeworkItems: [],
      completedDate: new Date().toISOString()
    };
  }

  async exportToPDF(options: ExportOptions): Promise<Buffer> {
    try {
      const html = this.generateHTML(options.reportType, options.session, options.client);
      console.log('Generated HTML length:', html.length);
      
      // Dynamic import of PDF generator
      const { generatePDF } = await import('./pdfGenerator');
      const pdf = await generatePDF(html);
      
      console.log('PDF generated successfully, size:', pdf.length);
      return pdf;
    } catch (error) {
      console.error('PDF export error:', error);
      throw new Error(`PDF export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async exportToWord(options: ExportOptions): Promise<Buffer> {
    try {
      const assessmentReport = this.generateSimpleReport(options.session);
      const reportData: ReportData = {
        report: assessmentReport,
        client: options.client,
        framework: { 
          id: options.session.frameworkId || 'cmmc_l1',
          name: options.session.frameworkId || 'CMMC', 
          path: '', 
          manifest: {} as any,
          enabled: true,
          totalControls: 0,
          estimatedTime: '0 minutes',
          domains: [],
          color: 'blue'
        } as any,
        generatedDate: new Date().toLocaleDateString()
      };
      
      const textContent = this.generateTextContent(options.reportType, reportData, options.client);
      
      // Dynamic import of Word generator
      const { generateWordDocument } = await import('./wordGenerator');
      const buffer = await generateWordDocument(textContent);
      
      return buffer;
    } catch (error) {
      console.error('Word export error:', error);
      throw new Error(`Word export failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private generateTextContent(
    reportType: ReportType, 
    reportData: ReportData, 
    client: Client
  ): string {
    let content = '';
    
    // Header
    content += `${this.getReportTitle(reportType)}\n`;
    content += `Client: ${client.companyName}\n`;
    content += `Generated: ${new Date().toLocaleDateString()}\n\n`;

    switch (reportType) {
      case 'executive':
        content += this.generateExecutiveTextContent(reportData, client);
        break;
      case 'technical':
        content += this.generateTechnicalTextContent(reportData, client);
        break;
      case 'homework':
        content += this.generateHomeworkTextContent(reportData, client);
        break;
      case 'progress':
        content += this.generateProgressTextContent(reportData, client);
        break;
      case 'certification':
        content += this.generateCertificationTextContent(reportData, client);
        break;
    }

    return content;
  }

  private generateExecutiveTextContent(reportData: ReportData, client: Client): string {
    let content = '';
    
    content += "ASSESSMENT OVERVIEW\n\n";
    content += `Overall Score: ${reportData.report.overview.percentage}% (${getReadinessLevel(reportData.report.overview.percentage).level})\n`;
    content += `Framework: ${reportData.framework.name}\n`;
    content += `Assessment Date: ${new Date().toLocaleDateString()}\n\n`;

    if (reportData.report.criticalFindings.length > 0) {
      content += "CRITICAL FINDINGS\n\n";
      reportData.report.criticalFindings.slice(0, 5).forEach(finding => {
        content += `${finding.domain}: ${finding.question}\n`;
      });
      content += "\n";
    }

    if (reportData.report.quickWins.length > 0) {
      content += "QUICK WINS\n\n";
      reportData.report.quickWins.slice(0, 5).forEach(win => {
        content += `${win.domain}: ${win.question}\n`;
      });
      content += "\n";
    }

    return content;
  }

  private generateTechnicalTextContent(reportData: ReportData, client: Client): string {
    let content = '';
    
    content += "TECHNICAL ASSESSMENT DETAILS\n\n";

    Object.entries(reportData.report.domainScores).forEach(([domain, score]: [string, any]) => {
      const domainFindings = reportData.report.criticalFindings.filter((f: any) => f.domain === domain);
      
      content += `${domain.toUpperCase()} DOMAIN\n`;
      content += `Score: ${Math.round(score.percentage)}%\n`;

      if (domainFindings.length > 0) {
        content += "Findings:\n";
        domainFindings.forEach((finding: any) => {
          content += `• ${finding.question}\n`;
        });
      }
      content += "\n";
    });

    return content;
  }

  private generateHomeworkTextContent(reportData: ReportData, client: Client): string {
    let content = '';
    
    content += "ACTION ITEMS AND FOLLOW-UP\n\n";

    if (reportData.report.homeworkItems.length > 0) {
      content += "REQUIRED ACTIONS:\n\n";

      reportData.report.homeworkItems.forEach((item: any, index: number) => {
        content += `${index + 1}. ${item.question}\n`;
        content += `   Priority: ${item.priority}\n\n`;
      });
    }

    return content;
  }

  private generateProgressTextContent(reportData: ReportData, client: Client): string {
    let content = '';
    
    content += "PROGRESS TRACKING REPORT\n\n";
    content += `Completion: ${reportData.report.overview.percentage}%\n`;
    content += `Questions Answered: ${reportData.report.overview.answeredQuestions} of ${reportData.report.overview.totalQuestions}\n\n`;

    Object.entries(reportData.report.domainScores).forEach(([domain, score]: [string, any]) => {
      content += `${domain}: ${Math.round(score.percentage)}%\n`;
    });

    return content;
  }

  private generateCertificationTextContent(reportData: ReportData, client: Client): string {
    let content = '';
    
    content += "CERTIFICATION READINESS ASSESSMENT\n\n";
    content += `Readiness Level: ${getReadinessLevel(reportData.report.overview.percentage).level}\n`;
    content += `Overall Score: ${reportData.report.overview.percentage}%\n\n`;

    const readinessText = reportData.report.overview.percentage >= 90 
      ? "Your organization demonstrates strong compliance readiness and should be well-prepared for certification."
      : reportData.report.overview.percentage >= 80
      ? "Your organization is nearly ready for certification with some areas requiring attention."
      : "Your organization requires significant improvement before pursuing certification.";

    content += "ASSESSMENT:\n\n";
    content += `${readinessText}\n\n`;

    return content;
  }

  async exportReport(options: ExportOptions): Promise<Buffer> {
    try {
      if (options.format === 'pdf') {
        return await this.exportToPDF(options);
      } else {
        return await this.exportToWord(options);
      }
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error(`Failed to export ${options.reportType} report as ${options.format}: ${error}`);
    }
  }

  getFileName(options: ExportOptions): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const extension = options.format === 'pdf' ? 'pdf' : 'docx';
    const reportName = options.reportType.charAt(0).toUpperCase() + options.reportType.slice(1);
    
    return `${options.client.companyName}_CMMC_${reportName}_${timestamp}.${extension}`;
  }
}

// Singleton instance
export const reportExporter = new ReportExporter();

// Utility functions for easy use
export async function exportReport(
  reportType: ReportType,
  format: ExportFormat,
  sessionId: string
): Promise<{ buffer: Buffer; fileName: string }> {
  const session = JSON.parse(localStorage.getItem(`session_${sessionId}`) || '{}');
  const client = getClient(session.clientId);
  
  if (!client) {
    throw new Error('Client not found');
  }

  const options: ExportOptions = {
    reportType,
    format,
    session,
    client
  };

  const buffer = await reportExporter.exportReport(options);
  const fileName = reportExporter.getFileName(options);

  return { buffer, fileName };
}

export async function exportAllReports(
  format: ExportFormat,
  sessionId: string
): Promise<{ [key: string]: { buffer: Buffer; fileName: string } }> {
  const reportTypes: ReportType[] = ['executive', 'technical', 'homework', 'progress', 'certification'];
  const results: { [key: string]: { buffer: Buffer; fileName: string } } = {};

  for (const reportType of reportTypes) {
    try {
      results[reportType] = await exportReport(reportType, format, sessionId);
    } catch (error) {
      console.error(`Failed to export ${reportType} report:`, error);
    }
  }

  return results;
}