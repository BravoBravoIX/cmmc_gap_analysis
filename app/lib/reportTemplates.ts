// Report HTML templates for PDF/Word generation

import { AssessmentReport, Finding, Recommendation, HomeworkItem } from './scoringUtils';
import { Client, Framework } from './types';

export interface ReportData {
  report: AssessmentReport;
  client: Client;
  framework: Framework;
  generatedDate: string;
  consultantInfo?: {
    name: string;
    company: string;
    email: string;
    phone: string;
  };
}

// Base CSS styles for all reports
export function getBaseCSS(): string {
  return baseStyles;
}

const baseStyles = `
<style>
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 8.5in;
    margin: 0 auto;
    padding: 1in;
    background: white;
  }
  
  .header {
    border-bottom: 3px solid #1f2937;
    padding-bottom: 20px;
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .logo {
    max-height: 60px;
    max-width: 200px;
  }
  
  .company-info {
    text-align: right;
    color: #6b7280;
  }
  
  h1 {
    color: #1f2937;
    font-size: 28px;
    margin: 0 0 10px 0;
    font-weight: 600;
  }
  
  h2 {
    color: #374151;
    font-size: 20px;
    margin: 30px 0 15px 0;
    font-weight: 600;
    border-bottom: 2px solid #e5e7eb;
    padding-bottom: 5px;
  }
  
  h3 {
    color: #4b5563;
    font-size: 16px;
    margin: 20px 0 10px 0;
    font-weight: 600;
  }
  
  .score-badge {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: bold;
    font-size: 18px;
    margin: 10px 0;
  }
  
  .score-ready { background: #dcfce7; color: #166534; }
  .score-nearly { background: #dbeafe; color: #1e40af; }
  .score-developing { background: #fef3c7; color: #92400e; }
  .score-foundation { background: #fed7aa; color: #9a3412; }
  .score-initial { background: #fecaca; color: #991b1b; }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 20px;
    margin: 20px 0;
  }
  
  .metric-card {
    text-align: center;
    padding: 20px;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    background: #f9fafb;
  }
  
  .metric-value {
    font-size: 32px;
    font-weight: bold;
    color: #1f2937;
  }
  
  .metric-label {
    color: #6b7280;
    font-size: 14px;
    margin-top: 5px;
  }
  
  .finding {
    border-left: 4px solid #dc2626;
    padding: 15px;
    margin: 15px 0;
    background: #fef2f2;
    border-radius: 0 8px 8px 0;
  }
  
  .finding-critical { border-left-color: #dc2626; background: #fef2f2; }
  .finding-gap { border-left-color: #ea580c; background: #fff7ed; }
  .finding-partial { border-left-color: #d97706; background: #fffbeb; }
  
  .recommendation {
    border: 1px solid #e5e7eb;
    padding: 20px;
    margin: 15px 0;
    border-radius: 8px;
    background: white;
  }
  
  .priority-high { border-left: 4px solid #dc2626; }
  .priority-medium { border-left: 4px solid #d97706; }
  .priority-low { border-left: 4px solid #16a34a; }
  
  .homework-item {
    border: 1px solid #e5e7eb;
    padding: 15px;
    margin: 10px 0;
    border-radius: 8px;
    background: #fefefe;
  }
  
  .control-id {
    font-family: monospace;
    background: #f3f4f6;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: bold;
  }
  
  .footer {
    margin-top: 50px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    color: #6b7280;
    font-size: 12px;
  }
  
  .page-break {
    page-break-before: always;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  
  th, td {
    border: 1px solid #e5e7eb;
    padding: 12px;
    text-align: left;
  }
  
  th {
    background: #f9fafb;
    font-weight: 600;
  }
  
  .text-center { text-align: center; }
  .text-right { text-align: right; }
  .mb-20 { margin-bottom: 20px; }
  .mt-30 { margin-top: 30px; }
  
  @media print {
    body { margin: 0; padding: 0.5in; }
    .page-break { page-break-before: always; }
  }
</style>
`;

function getScoreClass(percentage: number): string {
  if (percentage >= 90) return 'score-ready';
  if (percentage >= 80) return 'score-nearly';
  if (percentage >= 60) return 'score-developing';
  if (percentage >= 40) return 'score-foundation';
  return 'score-initial';
}

function getReadinessText(percentage: number): string {
  if (percentage >= 90) return 'Ready for Certification';
  if (percentage >= 80) return 'Nearly Ready';
  if (percentage >= 60) return 'Developing Compliance';
  if (percentage >= 40) return 'Foundation Needed';
  return 'Initial Planning Required';
}

function generateHeader(data: ReportData): string {
  return `
    <div class="header">
      <div style="display: flex; align-items: center; gap: 15px;">
        <img src="/CyberOps-Logo-Large.png" alt="Company Logo" style="max-height: 50px; max-width: 150px;" />
        <div style="border-left: 2px solid #e5e7eb; padding-left: 15px;">
          <h1>CMMC Assessment Report</h1>
          <div style="color: #6b7280; font-size: 14px;">${data.framework.name}</div>
        </div>
      </div>
      <div style="display: flex; align-items: center; gap: 20px;">
        ${data.client.logo ? `
          <img src="${data.client.logo}" alt="${data.client.companyName} Logo" class="logo" />
        ` : ''}
        <div class="company-info">
          <div><strong>${data.client.companyName}</strong></div>
          <div>${data.generatedDate}</div>
          ${data.consultantInfo ? `
            <div style="margin-top: 10px; font-size: 12px;">
              ${data.consultantInfo.name}<br>
              ${data.consultantInfo.company}<br>
              ${data.consultantInfo.email}
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

function generateFooter(): string {
  return `
    <div class="footer">
      <p>This report was generated using the CMMC Gap Analysis Tool</p>
      <p>Confidential and Proprietary - For Internal Use Only</p>
    </div>
  `;
}

export function generateExecutiveSummaryHTML(data: ReportData): string {
  const { report, client } = data;
  const scoreClass = getScoreClass(report.overview.percentage);
  const readinessText = getReadinessText(report.overview.percentage);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Executive Summary - ${client.companyName}</title>
  ${baseStyles}
</head>
<body>
  ${generateHeader(data)}
  
  <div style="text-align: center; margin: 30px 0;">
    <h2>Executive Summary</h2>
    <div class="score-badge ${scoreClass}">
      ${Math.round(report.overview.percentage)}% Compliant
    </div>
    <div style="margin-top: 10px; font-size: 18px; color: #4b5563;">
      ${readinessText}
    </div>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value" style="color: #16a34a;">${report.overview.yesCount}</div>
      <div class="metric-label">Controls Implemented</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="color: #d97706;">${report.overview.partialCount}</div>
      <div class="metric-label">Partially Implemented</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="color: #dc2626;">${report.overview.noCount}</div>
      <div class="metric-label">Implementation Gaps</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="color: #6b7280;">${report.overview.unsureCount}</div>
      <div class="metric-label">Require Verification</div>
    </div>
  </div>

  <h2>Key Findings</h2>
  ${report.criticalFindings.length > 0 ? `
    <p>The assessment identified <strong>${report.criticalFindings.length} critical findings</strong> that require immediate attention:</p>
    ${report.criticalFindings.slice(0, 5).map((finding: Finding) => `
      <div class="finding finding-${finding.status}">
        <div><strong><span class="control-id">${finding.controlId}</span></strong></div>
        <div>${finding.question}</div>
        ${finding.notes ? `<div style="margin-top: 10px; font-style: italic;">Note: ${finding.notes}</div>` : ''}
      </div>
    `).join('')}
  ` : `
    <div style="text-align: center; padding: 30px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
      <strong>No critical findings identified!</strong>
      <p style="margin-top: 10px; color: #166534;">Your organization demonstrates strong CMMC compliance practices.</p>
    </div>
  `}

  <h2>Recommendations</h2>
  ${report.recommendations.slice(0, 3).map((rec: Recommendation) => `
    <div class="recommendation priority-${rec.priority}">
      <h3>${rec.title}</h3>
      <p>${rec.description}</p>
      <div style="margin-top: 10px; color: #6b7280;">
        <strong>Timeline:</strong> ${rec.timeline} | 
        <strong>Effort:</strong> ${rec.effort} | 
        <strong>Priority:</strong> ${rec.priority}
      </div>
    </div>
  `).join('')}

  <h2>Next Steps</h2>
  <ol>
    ${report.homeworkItems.length > 0 ? `<li><strong>Complete Verification Items:</strong> ${report.homeworkItems.length} controls require additional verification or documentation.</li>` : ''}
    <li><strong>Address Critical Findings:</strong> Focus on the ${report.criticalFindings.length} high-priority gaps identified in this assessment.</li>
    <li><strong>Implement Quick Wins:</strong> ${report.quickWins.length} controls can be quickly improved with minimal effort.</li>
    <li><strong>Develop Implementation Roadmap:</strong> Create a prioritized action plan based on the detailed technical findings.</li>
    <li><strong>Schedule Follow-up Assessment:</strong> Plan reassessment after implementing recommendations.</li>
  </ol>

  ${generateFooter()}
</body>
</html>
  `;
}

export function generateTechnicalFindingsHTML(data: ReportData): string {
  const { report } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Technical Findings - ${data.client.companyName}</title>
  ${baseStyles}
</head>
<body>
  ${generateHeader(data)}
  
  <h2>Technical Assessment Findings</h2>
  
  <h3>Domain Score Breakdown</h3>
  <table>
    <thead>
      <tr>
        <th>Security Domain</th>
        <th>Score</th>
        <th>Implemented</th>
        <th>Partial</th>
        <th>Gaps</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${report.domainScores.map(domain => `
        <tr>
          <td><strong>${domain.title}</strong></td>
          <td class="text-center">${Math.round(domain.percentage)}%</td>
          <td class="text-center">${domain.yesCount}</td>
          <td class="text-center">${domain.partialCount}</td>
          <td class="text-center">${domain.noCount}</td>
          <td class="text-center">
            <span style="color: ${domain.percentage >= 80 ? '#16a34a' : domain.percentage >= 60 ? '#d97706' : '#dc2626'}">
              ${domain.percentage >= 80 ? 'Good' : domain.percentage >= 60 ? 'Needs Work' : 'Critical'}
            </span>
          </td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="page-break"></div>

  <h2>Critical Findings</h2>
  ${report.criticalFindings.length > 0 ? 
    report.criticalFindings.map((finding: Finding, index) => `
      <div class="finding finding-${finding.status}">
        <h3>${index + 1}. <span class="control-id">${finding.controlId}</span></h3>
        <p><strong>Question:</strong> ${finding.question}</p>
        <p><strong>Current Status:</strong> ${finding.answer}</p>
        <p><strong>Impact:</strong> ${finding.impact} | <strong>Implementation Effort:</strong> ${finding.effort}</p>
        ${finding.evidenceOrganized !== undefined ? `<p><strong>Evidence Organized:</strong> ${finding.evidenceOrganized ? 'Yes' : 'No'}</p>` : ''}
        ${finding.notes ? `<p><strong>Notes:</strong> ${finding.notes}</p>` : ''}
        <div style="margin-top: 15px; padding: 10px; background: #f9fafb; border-radius: 4px;">
          <strong>Recommended Action:</strong> Implement this control as a high priority to address compliance gaps.
        </div>
      </div>
    `).join('') 
    : '<p>No critical findings identified in this assessment.</p>'
  }

  <div class="page-break"></div>

  <h2>Quick Win Opportunities</h2>
  ${report.quickWins.length > 0 ?
    report.quickWins.map((finding: Finding, index) => `
      <div class="finding finding-partial">
        <h3>${index + 1}. <span class="control-id">${finding.controlId}</span></h3>
        <p><strong>Question:</strong> ${finding.question}</p>
        <p><strong>Current Status:</strong> Partially Implemented</p>
        <p><strong>Effort Required:</strong> ${finding.effort}</p>
        <div style="margin-top: 15px; padding: 10px; background: #fffbeb; border-radius: 4px;">
          <strong>Quick Win Opportunity:</strong> This control is partially implemented and can be completed with minimal effort.
        </div>
      </div>
    `).join('')
    : '<p>No quick win opportunities identified.</p>'
  }

  <h2>Implementation Recommendations</h2>
  ${report.recommendations.map((rec: Recommendation, index) => `
    <div class="recommendation priority-${rec.priority}">
      <h3>${index + 1}. ${rec.title}</h3>
      <p>${rec.description}</p>
      <table style="margin-top: 15px;">
        <tr>
          <td><strong>Type:</strong></td>
          <td>${rec.type}</td>
        </tr>
        <tr>
          <td><strong>Priority:</strong></td>
          <td>${rec.priority}</td>
        </tr>
        <tr>
          <td><strong>Effort Level:</strong></td>
          <td>${rec.effort}</td>
        </tr>
        <tr>
          <td><strong>Timeline:</strong></td>
          <td>${rec.timeline}</td>
        </tr>
      </table>
    </div>
  `).join('')}

  ${generateFooter()}
</body>
</html>
  `;
}

export function generateHomeworkDocumentHTML(data: ReportData): string {
  const { report } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Follow-up Assignment - ${data.client.companyName}</title>
  ${baseStyles}
</head>
<body>
  ${generateHeader(data)}
  
  <h2>Assessment Follow-up Assignment</h2>
  
  <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0; color: #92400e;">Instructions</h3>
    <p>The following ${report.homeworkItems.length} controls require additional verification or documentation. Please review each item and provide the requested information.</p>
    <p><strong>Due Date:</strong> Please complete within 2 weeks of receiving this document.</p>
    <p><strong>Contact:</strong> ${data.consultantInfo?.email || 'your consultant'} for questions or clarification.</p>
  </div>

  ${report.homeworkItems.length > 0 ? 
    report.homeworkItems.map((item: HomeworkItem, index) => `
      <div class="homework-item">
        <h3>${index + 1}. <span class="control-id">${item.controlId}</span></h3>
        <p><strong>Question:</strong> ${item.question}</p>
        <p><strong>Context:</strong> ${item.context}</p>
        <p><strong>Priority:</strong> <span style="color: ${item.priority === 'high' ? '#dc2626' : item.priority === 'medium' ? '#d97706' : '#16a34a'}">${item.priority}</span></p>
        ${item.notes ? `<p><strong>Assessment Notes:</strong> ${item.notes}</p>` : ''}
        
        <div style="border-top: 1px solid #e5e7eb; margin-top: 15px; padding-top: 15px;">
          <p><strong>Please provide:</strong></p>
          <ul>
            <li>Current implementation status (Yes/Partial/No)</li>
            <li>Evidence organization status (organized/not organized)</li>
            <li>Contact person responsible for this control</li>
            <li>Any additional context or questions</li>
          </ul>
          
          <div style="margin-top: 15px; padding: 10px; background: #f9fafb; border-radius: 4px;">
            <strong>Response:</strong>
            <div style="height: 60px; border: 1px solid #d1d5db; margin-top: 5px; padding: 10px;">
              [To be completed by client]
            </div>
          </div>
        </div>
      </div>
    `).join('') 
    : `
    <div style="text-align: center; padding: 40px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
      <h3>No Follow-up Items Required</h3>
      <p>Excellent! All assessment questions were answered with confidence. No additional verification is needed at this time.</p>
    </div>
    `
  }

  ${report.homeworkItems.length > 0 ? `
    <div style="margin-top: 40px; padding: 20px; background: #eff6ff; border-radius: 8px;">
      <h3>Next Steps</h3>
      <ol>
        <li>Complete the response sections above</li>
        <li>Gather any supporting documentation</li>
        <li>Return completed document to ${data.consultantInfo?.email || 'your consultant'}</li>
        <li>Schedule follow-up meeting to review responses</li>
      </ol>
    </div>
  ` : ''}

  ${generateFooter()}
</body>
</html>
  `;
}

export function generateProgressTrackingHTML(data: ReportData, previousReport?: AssessmentReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Progress Tracking - ${data.client.companyName}</title>
  ${baseStyles}
</head>
<body>
  ${generateHeader(data)}
  
  <h2>CMMC Compliance Progress Report</h2>
  
  <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="margin-top: 0;">Assessment Overview</h3>
    <p>This report tracks your organization's progress toward CMMC compliance over time.</p>
  </div>

  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value">${Math.round(data.report.overview.percentage)}%</div>
      <div class="metric-label">Current Score</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.report.overview.yesCount}</div>
      <div class="metric-label">Implemented Controls</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.report.overview.noCount}</div>
      <div class="metric-label">Remaining Gaps</div>
    </div>
    <div class="metric-card">
      <div class="metric-value">${data.report.homeworkItems.length}</div>
      <div class="metric-label">Items to Verify</div>
    </div>
  </div>

  <h2>Domain Progress</h2>
  <table>
    <thead>
      <tr>
        <th>Domain</th>
        <th>Current Score</th>
        <th>Status</th>
        <th>Key Actions</th>
      </tr>
    </thead>
    <tbody>
      ${data.report.domainScores.map(domain => `
        <tr>
          <td><strong>${domain.title}</strong></td>
          <td class="text-center">${Math.round(domain.percentage)}%</td>
          <td class="text-center">
            <span style="color: ${domain.percentage >= 80 ? '#16a34a' : domain.percentage >= 60 ? '#d97706' : '#dc2626'}">
              ${domain.percentage >= 80 ? 'On Track' : domain.percentage >= 60 ? 'In Progress' : 'Needs Attention'}
            </span>
          </td>
          <td>${domain.noCount > 0 ? `${domain.noCount} controls need implementation` : 'Maintain current practices'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Recommended Next Steps</h2>
  ${data.report.recommendations.map((rec: Recommendation, index) => `
    <div class="recommendation priority-${rec.priority}">
      <h3>${index + 1}. ${rec.title}</h3>
      <p>${rec.description}</p>
      <p><strong>Timeline:</strong> ${rec.timeline} | <strong>Priority:</strong> ${rec.priority}</p>
    </div>
  `).join('')}

  <h2>Compliance Roadmap</h2>
  <div style="margin: 30px 0;">
    <h3>Short Term (1-3 months)</h3>
    <ul>
      ${data.report.quickWins.length > 0 ? `<li>Complete ${data.report.quickWins.length} quick win opportunities</li>` : ''}
      ${data.report.homeworkItems.length > 0 ? `<li>Verify ${data.report.homeworkItems.length} uncertain controls</li>` : ''}
      <li>Address highest priority critical findings</li>
    </ul>

    <h3>Medium Term (3-6 months)</h3>
    <ul>
      <li>Implement remaining critical controls</li>
      <li>Establish ongoing compliance processes</li>
      <li>Conduct staff training programs</li>
    </ul>

    <h3>Long Term (6-12 months)</h3>
    <ul>
      <li>Achieve target compliance percentage</li>
      <li>Prepare for formal CMMC assessment</li>
      <li>Maintain continuous compliance posture</li>
    </ul>
  </div>

  ${generateFooter()}
</body>
</html>
  `;
}

export function generateCertificationReadinessHTML(data: ReportData): string {
  const { report } = data;
  const readyControls = report.overview.yesCount;
  const totalControls = report.overview.maxPossibleScore;
  const readinessPercentage = (readyControls / totalControls) * 100;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Certification Readiness - ${data.client.companyName}</title>
  ${baseStyles}
</head>
<body>
  ${generateHeader(data)}
  
  <h2>CMMC Certification Readiness Assessment</h2>
  
  <div class="score-badge ${getScoreClass(readinessPercentage)}" style="display: block; text-align: center; margin: 30px 0;">
    ${Math.round(readinessPercentage)}% Certification Ready
  </div>

  <h3>Readiness Summary</h3>
  <table>
    <tr>
      <td><strong>Total Controls Assessed:</strong></td>
      <td>${report.overview.totalQuestions}</td>
    </tr>
    <tr>
      <td><strong>Fully Implemented:</strong></td>
      <td>${report.overview.yesCount}</td>
    </tr>
    <tr>
      <td><strong>Partially Implemented:</strong></td>
      <td>${report.overview.partialCount}</td>
    </tr>
    <tr>
      <td><strong>Implementation Gaps:</strong></td>
      <td>${report.overview.noCount}</td>
    </tr>
    <tr>
      <td><strong>Require Verification:</strong></td>
      <td>${report.overview.unsureCount}</td>
    </tr>
    <tr style="border-top: 2px solid #374151;">
      <td><strong>Certification Readiness:</strong></td>
      <td><strong>${getReadinessText(readinessPercentage)}</strong></td>
    </tr>
  </table>

  <h2>Pre-Assessment Checklist</h2>
  <div style="margin: 20px 0;">
    <h3>Critical Requirements</h3>
    ${report.criticalFindings.length === 0 ? 
      '<p style="color: #16a34a;">✓ All critical controls are implemented</p>' :
      `<p style="color: #dc2626;">✗ ${report.criticalFindings.length} critical findings must be resolved before certification</p>`
    }
    
    ${report.overview.noCount === 0 ? 
      '<p style="color: #16a34a;">✓ No implementation gaps identified</p>' :
      `<p style="color: #dc2626;">✗ ${report.overview.noCount} controls require implementation</p>`
    }
    
    ${report.homeworkItems.length === 0 ? 
      '<p style="color: #16a34a;">✓ All controls have been verified</p>' :
      `<p style="color: #d97706;">⚠ ${report.homeworkItems.length} controls require verification</p>`
    }
  </div>

  <h2>Outstanding Items</h2>
  ${report.criticalFindings.length > 0 || report.overview.noCount > 0 || report.homeworkItems.length > 0 ? `
    ${report.criticalFindings.length > 0 ? `
      <h3>Critical Findings (Must Resolve)</h3>
      ${report.criticalFindings.map((finding: Finding) => `
        <div class="finding finding-critical">
          <strong><span class="control-id">${finding.controlId}</span></strong>
          <p>${finding.question}</p>
        </div>
      `).join('')}
    ` : ''}

    ${report.homeworkItems.length > 0 ? `
      <h3>Verification Required</h3>
      ${report.homeworkItems.map((item: HomeworkItem) => `
        <div class="homework-item">
          <strong><span class="control-id">${item.controlId}</span></strong>
          <p>${item.question}</p>
        </div>
      `).join('')}
    ` : ''}
  ` : `
    <div style="text-align: center; padding: 40px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
      <h3>Ready for Certification Assessment</h3>
      <p>All controls have been implemented and verified. Your organization appears ready for formal CMMC assessment.</p>
    </div>
  `}

  <h2>Certification Timeline</h2>
  <div style="margin: 30px 0;">
    ${readinessPercentage >= 90 ? `
      <p><strong>Immediate (1-4 weeks):</strong> Schedule C3PAO assessment</p>
      <p><strong>Preparation:</strong> Gather evidence documentation</p>
      <p><strong>Assessment:</strong> Formal CMMC evaluation</p>
    ` : `
      <p><strong>Phase 1 (4-8 weeks):</strong> Resolve critical findings</p>
      <p><strong>Phase 2 (8-12 weeks):</strong> Complete remaining implementations</p>
      <p><strong>Phase 3 (12-16 weeks):</strong> Final verification and C3PAO preparation</p>
    `}
  </div>

  <h2>Evidence Requirements</h2>
  <p>For formal assessment, ensure the following evidence is available:</p>
  <ul>
    <li>Documented policies and procedures for all implemented controls</li>
    <li>Configuration screenshots and settings documentation</li>
    <li>Training records and certification documentation</li>
    <li>Incident response and audit logs</li>
    <li>System diagrams and network architecture documentation</li>
    <li>Vendor documentation and security attestations</li>
  </ul>

  ${generateFooter()}
</body>
</html>
  `;
}