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

// NEW RPO-FOCUSED REPORTS

export function generateFollowUpReportHTML(data: ReportData): string {
  const { report, client } = data;
  
  // Extract homework items and questions requiring follow-up
  const homeworkItems = report.homeworkItems || [];
  const unsureResponses = Object.values(data.report.overview || {}).filter((response: any) => 
    response && response.answer === 'unsure'
  );
  const partialResponses = Object.values(data.report.overview || {}).filter((response: any) => 
    response && response.answer === 'partial'
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Follow-Up Report - ${client.companyName}</title>
  ${baseStyles}
</head>
<body>
  ${generateHeader(data)}
  
  <h1>Follow-Up Report</h1>
  <p style="color: #6b7280; margin-bottom: 30px;">
    <strong>Questions on Notice</strong> - Documentation requests and action items requiring client response
  </p>

  <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
    <h3 style="color: #92400e; margin-top: 0;">⏰ Response Timeline</h3>
    <p style="color: #92400e; margin-bottom: 0;">
      Please provide responses within <strong>5 business days</strong> to maintain project momentum.
      Priority items are marked for immediate attention.
    </p>
  </div>

  ${homeworkItems.length > 0 ? `
    <h2>📋 Action Items</h2>
    <p>The following items require client action or documentation:</p>
    
    ${homeworkItems.map((item: any, index: number) => `
      <div class="homework-item" style="margin: 20px 0;">
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
          <h4 style="margin: 0; color: #1f2937;">Item ${index + 1}: <span class="control-id">${item.controlId || item.questionId}</span></h4>
          <span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
            ${item.priority || 'Medium'} Priority
          </span>
        </div>
        <p><strong>Question:</strong> ${item.question || item.context}</p>
        ${item.notes ? `<p><strong>Notes:</strong> ${item.notes}</p>` : ''}
        <div style="background: #f9fafb; padding: 15px; border-left: 4px solid #d1d5db; margin-top: 10px;">
          <strong>Required Response:</strong> Please provide evidence, documentation, or clarification for this control implementation.
        </div>
      </div>
    `).join('')}
  ` : ''}

  ${unsureResponses.length > 0 ? `
    <h2>❓ Verification Required</h2>
    <p>These controls require verification or additional information:</p>
    
    ${unsureResponses.slice(0, 10).map((response: any, index: number) => `
      <div class="homework-item">
        <h4>Item ${homeworkItems.length + index + 1}: <span class="control-id">${response.controlId || response.questionId}</span></h4>
        <p><strong>Question:</strong> ${response.question}</p>
        ${response.notes ? `<p><strong>Assessment Notes:</strong> ${response.notes}</p>` : ''}
        <div style="background: #f0f9ff; padding: 15px; border-left: 4px solid #0ea5e9; margin-top: 10px;">
          <strong>Next Steps:</strong> Please confirm implementation status and provide supporting documentation.
        </div>
      </div>
    `).join('')}
  ` : ''}

  ${partialResponses.length > 0 ? `
    <h2>⚠️ Partial Implementations</h2>
    <p>These controls are partially implemented and may require additional work:</p>
    
    ${partialResponses.slice(0, 10).map((response: any, index: number) => `
      <div class="homework-item">
        <h4>Review Item ${homeworkItems.length + unsureResponses.length + index + 1}: <span class="control-id">${response.controlId || response.questionId}</span></h4>
        <p><strong>Question:</strong> ${response.question}</p>
        ${response.notes ? `<p><strong>Current Status:</strong> ${response.notes}</p>` : ''}
        <div style="background: #fff7ed; padding: 15px; border-left: 4px solid #ea580c; margin-top: 10px;">
          <strong>Action Required:</strong> Complete implementation or provide justification for partial compliance.
        </div>
      </div>
    `).join('')}
  ` : ''}

  ${homeworkItems.length === 0 && unsureResponses.length === 0 && partialResponses.length === 0 ? `
    <div style="text-align: center; padding: 60px 20px; background: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 12px;">
      <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
      <h2 style="color: #166534; margin-bottom: 10px;">No Follow-Up Required</h2>
      <p style="color: #166534; margin-bottom: 0;">
        All assessment questions were answered with confidence. The gap analysis report contains your complete findings.
      </p>
    </div>
  ` : `
    <h2>📞 Next Steps</h2>
    <ol style="line-height: 1.8;">
      <li><strong>Review</strong> all action items and priority levels</li>
      <li><strong>Assign</strong> responsible team members for each item</li>
      <li><strong>Gather</strong> required documentation and evidence</li>
      <li><strong>Schedule</strong> follow-up meeting within 5 business days</li>
      <li><strong>Contact</strong> your RPO with questions or clarifications</li>
    </ol>

    <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 8px; margin-top: 30px;">
      <h3 style="color: #1e40af; margin-top: 0;">📧 Submit Responses</h3>
      <p style="color: #1e40af; margin-bottom: 0;">
        Please email completed responses and documentation to your assigned RPO. 
        Reference the item numbers for efficient processing.
      </p>
    </div>
  `}

  ${generateFooter()}
</body>
</html>
  `;
}

export function generateGapAnalysisReportHTML(data: ReportData): string {
  const { report, client } = data;
  const scoreClass = getScoreClass(report.overview.percentage);
  const readinessText = getReadinessText(report.overview.percentage);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Gap Analysis Report - ${client.companyName}</title>
  ${baseStyles}
</head>
<body>
  ${generateHeader(data)}
  
  <h1>CMMC Gap Analysis Report</h1>
  <p style="color: #6b7280; margin-bottom: 30px;">
    Comprehensive compliance assessment with risk-prioritized findings and implementation roadmap
  </p>

  <!-- Executive Summary Section -->
  <h2>Executive Summary</h2>
  <div style="text-align: center; margin: 30px 0;">
    <div class="score-badge ${scoreClass}">
      ${Math.round(report.overview.percentage)}% Compliant
    </div>
    <div style="margin-top: 10px; font-size: 18px; color: #4b5563;">
      ${readinessText}
    </div>
  </div>

  <!-- Business Context -->
  <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Business Context</h3>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <strong>Company:</strong> ${client.companyName}<br>
        <strong>Industry:</strong> ${client.industry || 'Not specified'}<br>
        <strong>Employees:</strong> ${client.size?.employees || 'Not specified'}
      </div>
      <div>
        <strong>Federal Contracts:</strong> ${client.contracts?.hasFederalContracts ? 'Yes' : 'No'}<br>
        <strong>CUI Handling:</strong> ${client.contracts?.handlesCUI ? 'Yes' : 'No'}<br>
        <strong>FCI Handling:</strong> ${client.contracts?.handlesFCI ? 'Yes' : 'No'}
      </div>
    </div>
  </div>

  <!-- Risk Assessment -->
  <h2>Risk Assessment</h2>
  ${report.overview.percentage < 60 ? `
    <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #dc2626; margin-top: 0;">🚨 High Risk - Immediate Action Required</h3>
      <p style="color: #dc2626;">
        Current compliance level presents significant risk for federal contract eligibility. 
        Immediate remediation is required before pursuing CMMC certification.
      </p>
    </div>
  ` : report.overview.percentage < 80 ? `
    <div style="background: #fffbeb; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #d97706; margin-top: 0;">⚠️ Medium Risk - Remediation Needed</h3>
      <p style="color: #d97706;">
        Substantial compliance gaps require attention. Implementation plan recommended 
        before pursuing certification assessment.
      </p>
    </div>
  ` : `
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #16a34a; margin-top: 0;">✅ Low Risk - Good Compliance Posture</h3>
      <p style="color: #16a34a;">
        Strong compliance foundation with minor gaps. Well-positioned for successful 
        CMMC certification with focused remediation.
      </p>
    </div>
  `}

  <!-- Implementation Metrics -->
  <div class="metrics-grid">
    <div class="metric-card">
      <div class="metric-value" style="color: #16a34a;">${report.overview.yesCount}</div>
      <div class="metric-label">Fully Implemented</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="color: #d97706;">${report.overview.partialCount}</div>
      <div class="metric-label">Partial Implementation</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="color: #dc2626;">${report.overview.noCount}</div>
      <div class="metric-label">Not Implemented</div>
    </div>
    <div class="metric-card">
      <div class="metric-value" style="color: #6b7280;">${report.overview.unsureCount}</div>
      <div class="metric-label">Require Verification</div>
    </div>
  </div>

  <!-- Critical Findings -->
  ${report.criticalFindings && report.criticalFindings.length > 0 ? `
    <h2>🔥 Critical Findings</h2>
    <p>These findings represent the highest risk to compliance and require immediate attention:</p>
    
    ${report.criticalFindings.slice(0, 10).map((finding: any, index: number) => `
      <div class="finding finding-critical">
        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
          <strong><span class="control-id">${finding.controlId}</span></strong>
          <span style="background: #fef2f2; color: #dc2626; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
            Priority ${index + 1}
          </span>
        </div>
        <p><strong>Issue:</strong> ${finding.question}</p>
        ${finding.notes ? `<p><strong>Current State:</strong> ${finding.notes}</p>` : ''}
        <div style="background: #fef2f2; padding: 10px; border-radius: 4px; margin-top: 10px;">
          <strong>Business Impact:</strong> ${finding.impact || 'Contract eligibility risk, potential audit findings, security vulnerabilities'}
        </div>
        <div style="background: #f0fdf4; padding: 10px; border-radius: 4px; margin-top: 5px;">
          <strong>Recommended Action:</strong> ${finding.remediation || 'Implement control as specified in NIST 800-171 requirements'}
        </div>
      </div>
    `).join('')}
  ` : ''}

  <!-- Implementation Roadmap -->
  <h2>📋 Implementation Roadmap</h2>
  
  <h3>Phase 1: Critical Remediation (Weeks 1-4)</h3>
  <ul>
    ${report.overview.noCount > 0 ? `
      <li>Address ${report.overview.noCount} unimplemented controls</li>
      <li>Focus on highest-risk domains first</li>
      <li>Establish baseline security policies</li>
    ` : '<li>✅ All critical controls implemented</li>'}
  </ul>

  <h3>Phase 2: Compliance Enhancement (Weeks 5-8)</h3>
  <ul>
    ${report.overview.partialCount > 0 ? `
      <li>Complete ${report.overview.partialCount} partially implemented controls</li>
      <li>Enhance documentation and evidence collection</li>
      <li>Implement monitoring and maintenance procedures</li>
    ` : '<li>✅ All controls fully implemented</li>'}
  </ul>

  <h3>Phase 3: Assessment Preparation (Weeks 9-12)</h3>
  <ul>
    <li>Conduct internal compliance validation</li>
    <li>Organize evidence packages for C3PAO</li>
    <li>Schedule formal CMMC assessment</li>
    <li>Final gap remediation and documentation</li>
  </ul>

  <!-- Cost and Timeline Estimates -->
  <h2>💰 Investment Analysis</h2>
  
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 20px 0;">
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
      <h3>Estimated Timeline</h3>
      <ul style="margin: 0; padding-left: 20px;">
        ${report.overview.percentage >= 80 ? `
          <li><strong>4-8 weeks</strong> to certification readiness</li>
          <li><strong>2-4 weeks</strong> for C3PAO assessment</li>
          <li><strong>Total: 6-12 weeks</strong></li>
        ` : `
          <li><strong>8-12 weeks</strong> to certification readiness</li>
          <li><strong>2-4 weeks</strong> for C3PAO assessment</li>
          <li><strong>Total: 10-16 weeks</strong></li>
        `}
      </ul>
    </div>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px;">
      <h3>Investment Categories</h3>
      <ul style="margin: 0; padding-left: 20px;">
        <li>Security technology and tools</li>
        <li>Policy development and documentation</li>
        <li>Staff training and certification</li>
        <li>C3PAO assessment fees</li>
        <li>Ongoing compliance maintenance</li>
      </ul>
    </div>
  </div>

  <!-- Certification Readiness -->
  <h2>🎯 Certification Readiness</h2>
  <div style="background: #f8fafc; padding: 20px; border-left: 4px solid #64748b; margin: 20px 0;">
    ${report.overview.percentage >= 90 ? `
      <h3 style="color: #16a34a;">Ready for C3PAO Assessment</h3>
      <p>Your organization demonstrates strong CMMC compliance readiness. Consider scheduling 
      a formal assessment to achieve certification.</p>
    ` : report.overview.percentage >= 80 ? `
      <h3 style="color: #d97706;">Nearly Ready</h3>
      <p>With focused remediation efforts, your organization can achieve certification 
      readiness within the recommended timeline.</p>
    ` : `
      <h3 style="color: #dc2626;">Substantial Work Required</h3>
      <p>Significant compliance gaps require systematic remediation before pursuing 
      formal certification assessment.</p>
    `}
  </div>

  <!-- Next Steps -->
  <h2>🚀 Immediate Next Steps</h2>
  <ol style="line-height: 1.8;">
    <li><strong>Executive Review:</strong> Present findings to leadership for budget and resource approval</li>
    <li><strong>Project Planning:</strong> Establish implementation team and assign responsibilities</li>
    <li><strong>Vendor Selection:</strong> Engage security technology partners as needed</li>
    <li><strong>Timeline Confirmation:</strong> Set realistic milestones based on organizational capacity</li>
    <li><strong>Progress Monitoring:</strong> Schedule monthly compliance reviews</li>
  </ol>

  ${generateFooter()}
</body>
</html>
  `;
}

export function generateExecutiveBriefHTML(data: ReportData): string {
  const { report, client } = data;
  const scoreClass = getScoreClass(report.overview.percentage);
  const readinessText = getReadinessText(report.overview.percentage);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Executive Brief - ${client.companyName}</title>
  ${baseStyles}
</head>
<body>
  ${generateHeader(data)}
  
  <h1>Executive Brief</h1>
  <p style="color: #6b7280; margin-bottom: 30px;">
    Concise CMMC compliance summary for executive leadership and decision makers
  </p>

  <!-- Key Findings -->
  <div style="text-align: center; margin: 30px 0;">
    <div class="score-badge ${scoreClass}">
      ${Math.round(report.overview.percentage)}% Compliant
    </div>
    <div style="margin-top: 10px; font-size: 18px; color: #4b5563;">
      ${readinessText}
    </div>
  </div>

  <!-- Business Impact -->
  <h2>Business Impact</h2>
  ${client.contracts?.hasFederalContracts ? `
    <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #92400e; margin-top: 0;">⚠️ Contract Risk Assessment</h3>
      <p style="color: #92400e; margin-bottom: 10px;">
        <strong>Federal Contract Status:</strong> Active contracts requiring CMMC compliance
      </p>
      <p style="color: #92400e; margin-bottom: 0;">
        ${report.overview.percentage < 80 ? 
          'Current compliance gaps may impact contract renewals and new bid opportunities.' :
          'Strong compliance posture supports continued federal contracting eligibility.'
        }
      </p>
    </div>
  ` : ''}

  <!-- Investment Summary -->
  <h2>Investment Required</h2>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;">
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; color: #1f2937;">
        ${report.overview.percentage >= 80 ? '6-12' : '10-16'}
      </div>
      <div style="color: #6b7280; font-size: 14px;">Weeks to Certification</div>
    </div>
    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; text-align: center;">
      <div style="font-size: 24px; font-weight: bold; color: #1f2937;">
        ${report.overview.noCount + report.overview.partialCount}
      </div>
      <div style="color: #6b7280; font-size: 14px;">Controls Requiring Work</div>
    </div>
  </div>

  <!-- Strategic Recommendations -->
  <h2>Strategic Recommendations</h2>
  
  ${report.overview.percentage >= 90 ? `
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px;">
      <h3 style="color: #16a34a; margin-top: 0;">✅ Proceed with Certification</h3>
      <ul style="color: #166534; margin-bottom: 0;">
        <li>Schedule C3PAO assessment immediately</li>
        <li>Finalize evidence documentation</li>
        <li>Maintain current security posture</li>
      </ul>
    </div>
  ` : report.overview.percentage >= 70 ? `
    <div style="background: #fffbeb; border: 1px solid #fbbf24; padding: 20px; border-radius: 8px;">
      <h3 style="color: #d97706; margin-top: 0;">⚡ Accelerated Remediation</h3>
      <ul style="color: #92400e; margin-bottom: 0;">
        <li>Prioritize critical security gaps</li>
        <li>Invest in compliance technology</li>
        <li>Engage external security expertise</li>
        <li>Target certification within 3-4 months</li>
      </ul>
    </div>
  ` : `
    <div style="background: #fef2f2; border: 1px solid #fca5a5; padding: 20px; border-radius: 8px;">
      <h3 style="color: #dc2626; margin-top: 0;">🚨 Comprehensive Remediation</h3>
      <ul style="color: #dc2626; margin-bottom: 0;">
        <li>Establish dedicated compliance program</li>
        <li>Significant technology and process investment required</li>
        <li>Consider phased approach over 6-8 months</li>
        <li>Engage CMMC consulting partner</li>
      </ul>
    </div>
  `}

  <!-- ROI Analysis -->
  <h2>Return on Investment</h2>
  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Benefits of CMMC Certification</h3>
    <ul style="margin-bottom: 0;">
      <li><strong>Contract Eligibility:</strong> Access to federal contracts requiring CMMC</li>
      <li><strong>Competitive Advantage:</strong> Differentiation in federal marketplace</li>
      <li><strong>Security Posture:</strong> Enhanced protection against cyber threats</li>
      <li><strong>Risk Mitigation:</strong> Reduced compliance and security incident risk</li>
      <li><strong>Operational Efficiency:</strong> Standardized security processes</li>
    </ul>
  </div>

  <!-- Decision Points -->
  <h2>Executive Decision Required</h2>
  <div style="border: 2px solid #3b82f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #1e40af; margin-top: 0;">Immediate Actions</h3>
    <ol style="color: #1e40af; line-height: 1.6; margin-bottom: 0;">
      <li><strong>Budget Approval:</strong> Allocate resources for compliance program</li>
      <li><strong>Timeline Commitment:</strong> Set realistic certification target date</li>
      <li><strong>Team Assignment:</strong> Designate compliance program owner</li>
      <li><strong>Vendor Engagement:</strong> Select implementation partners</li>
    </ol>
  </div>

  ${generateFooter()}
</body>
</html>
  `;
}