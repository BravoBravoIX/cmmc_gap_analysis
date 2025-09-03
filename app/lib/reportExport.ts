// Import generators dynamically when needed
import { Session, Client } from './types';
import { 
  generateFollowUpReportHTML,
  generateGapAnalysisReportHTML,
  generateExecutiveBriefHTML,
  getBaseCSS,
  ReportData
} from './reportTemplates';
import { calculateScore, generateAssessmentReport, getReadinessLevel } from './scoringUtils';
import { getClient } from './clientUtils';

export type ExportFormat = 'pdf' | 'docx';
export type ReportType = 'followup' | 'gap_analysis' | 'executive';

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
      case 'followup':
        content = generateFollowUpReportHTML(data);
        break;
      case 'gap_analysis':
        content = generateGapAnalysisReportHTML(data);
        break;
      case 'executive':
        content = generateExecutiveBriefHTML(data);
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
      followup: 'Follow-Up Report',
      gap_analysis: 'Gap Analysis Report', 
      executive: 'Executive Brief'
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
      case 'followup':
        content += this.generateFollowUpTextContent(reportData, client);
        break;
      case 'gap_analysis':
        content += this.generateGapAnalysisTextContent(reportData, client);
        break;
      case 'executive':
        content += this.generateExecutiveBriefTextContent(reportData, client);
        break;
    }

    return content;
  }

  private generateFollowUpTextContent(reportData: ReportData, client: Client): string {
    let content = '';
    
    content += "QUESTIONS ON NOTICE - FOLLOW-UP REQUIRED\n\n";
    content += "Response Timeline: Please provide responses within 5 business days\n\n";

    const homeworkItems = reportData.report.homeworkItems || [];
    if (homeworkItems.length > 0) {
      content += "ACTION ITEMS:\n\n";
      homeworkItems.forEach((item: any, index: number) => {
        content += `${index + 1}. [${item.controlId || item.questionId}] ${item.question || item.context}\n`;
        if (item.notes) content += `   Notes: ${item.notes}\n`;
        content += `   Priority: ${item.priority || 'Medium'}\n`;
        content += `   Required Response: Provide evidence, documentation, or clarification\n\n`;
      });
    } else {
      content += "✓ No follow-up items required. All questions were answered with confidence.\n\n";
    }

    content += "NEXT STEPS:\n";
    content += "1. Review all action items and assign responsible team members\n";
    content += "2. Gather required documentation and evidence\n";
    content += "3. Schedule follow-up meeting within 5 business days\n";
    content += "4. Submit responses to your assigned RPO\n\n";

    return content;
  }

  private generateGapAnalysisTextContent(reportData: ReportData, client: Client): string {
    let content = '';
    
    content += "COMPREHENSIVE CMMC GAP ANALYSIS\n\n";
    content += `Overall Compliance: ${reportData.report.overview.percentage}%\n`;
    content += `Readiness Level: ${getReadinessLevel(reportData.report.overview.percentage).level}\n\n`;

    content += "BUSINESS CONTEXT:\n";
    content += `Company: ${client.companyName}\n`;
    content += `Industry: ${client.industry || 'Not specified'}\n`;
    content += `Federal Contracts: ${client.contracts?.hasFederalContracts ? 'Yes' : 'No'}\n`;
    content += `CUI Handling: ${client.contracts?.handlesCUI ? 'Yes' : 'No'}\n\n`;

    content += "IMPLEMENTATION STATUS:\n";
    content += `✓ Fully Implemented: ${reportData.report.overview.yesCount} controls\n`;
    content += `◐ Partial Implementation: ${reportData.report.overview.partialCount} controls\n`;
    content += `✗ Not Implemented: ${reportData.report.overview.noCount} controls\n`;
    content += `? Require Verification: ${reportData.report.overview.unsureCount} controls\n\n`;

    content += "RISK ASSESSMENT:\n";
    if (reportData.report.overview.percentage < 60) {
      content += "🚨 HIGH RISK - Immediate action required for contract eligibility\n";
    } else if (reportData.report.overview.percentage < 80) {
      content += "⚠️ MEDIUM RISK - Substantial remediation needed before certification\n";
    } else {
      content += "✅ LOW RISK - Good compliance posture with focused remediation needed\n";
    }
    content += "\n";

    content += "IMPLEMENTATION ROADMAP:\n";
    content += "Phase 1 (Weeks 1-4): Critical remediation and baseline security\n";
    content += "Phase 2 (Weeks 5-8): Compliance enhancement and documentation\n";
    content += "Phase 3 (Weeks 9-12): Assessment preparation and final validation\n\n";

    content += "TIMELINE ESTIMATE:\n";
    if (reportData.report.overview.percentage >= 80) {
      content += "6-12 weeks to certification readiness\n";
    } else {
      content += "10-16 weeks to certification readiness\n";
    }
    content += "2-4 weeks for C3PAO assessment process\n\n";

    return content;
  }

  private generateExecutiveBriefTextContent(reportData: ReportData, client: Client): string {
    let content = '';
    
    content += "EXECUTIVE BRIEF - CMMC COMPLIANCE\n\n";
    content += `Overall Score: ${reportData.report.overview.percentage}% (${getReadinessLevel(reportData.report.overview.percentage).level})\n`;
    content += `Controls Requiring Work: ${reportData.report.overview.noCount + reportData.report.overview.partialCount}\n`;
    content += `Timeline to Certification: ${reportData.report.overview.percentage >= 80 ? '6-12' : '10-16'} weeks\n\n`;

    content += "BUSINESS IMPACT:\n";
    if (client.contracts?.hasFederalContracts) {
      content += "⚠️ Federal Contract Risk: ";
      if (reportData.report.overview.percentage < 80) {
        content += "Compliance gaps may impact contract renewals and new opportunities\n";
      } else {
        content += "Strong compliance posture supports continued federal contracting\n";
      }
    }
    content += "\n";

    content += "STRATEGIC RECOMMENDATION:\n";
    if (reportData.report.overview.percentage >= 90) {
      content += "✅ PROCEED WITH CERTIFICATION - Schedule C3PAO assessment immediately\n";
    } else if (reportData.report.overview.percentage >= 70) {
      content += "⚡ ACCELERATED REMEDIATION - Target certification within 3-4 months\n";
    } else {
      content += "🚨 COMPREHENSIVE REMEDIATION - Establish dedicated compliance program\n";
    }
    content += "\n";

    content += "IMMEDIATE EXECUTIVE ACTIONS REQUIRED:\n";
    content += "1. Budget approval for compliance program investment\n";
    content += "2. Set realistic certification target timeline\n";
    content += "3. Assign dedicated compliance program owner\n";
    content += "4. Engage implementation partners and vendors\n\n";

    content += "ROI BENEFITS:\n";
    content += "• Access to federal contracts requiring CMMC\n";
    content += "• Competitive advantage in federal marketplace\n";
    content += "• Enhanced cybersecurity protection\n";
    content += "• Reduced compliance and security risks\n\n";

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
  const reportTypes: ReportType[] = ['followup', 'gap_analysis', 'executive'];
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