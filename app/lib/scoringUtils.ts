// Scoring and reporting utilities

import { Session, Answer, Framework, Question, Domain } from './types';

export interface ScoreBreakdown {
  totalQuestions: number;
  answeredQuestions: number;
  yesCount: number;
  partialCount: number;
  noCount: number;
  unsureCount: number;
  skippedCount: number;
  naCount: number;
  
  // Calculated scores
  rawScore: number;          // Yes + (Partial * 0.5)
  maxPossibleScore: number;  // Total applicable questions
  percentage: number;        // (rawScore / maxPossibleScore) * 100
  
  // Weighted scores (if applicable)
  weightedScore?: number;
  weightedPercentage?: number;
}

export interface DomainScore extends ScoreBreakdown {
  domain: string;
  title: string;
  level: number;
}

export interface AssessmentReport {
  overview: ScoreBreakdown;
  domainScores: DomainScore[];
  criticalFindings: Finding[];
  quickWins: Finding[];
  recommendations: Recommendation[];
  homeworkItems: HomeworkItem[];
  metadata: {
    sessionId: string;
    frameworkId: string;
    clientId: string;
    generatedAt: string;
    assessmentDuration?: number;
  };
}

export interface Finding {
  controlId: string;
  question: string;
  status: 'critical' | 'gap' | 'partial' | 'compliant';
  answer: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  notes?: string;
  evidenceOrganized?: boolean;
  domain: string;
}

export interface Recommendation {
  type: 'implementation' | 'improvement' | 'verification';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  controls: string[];
  effort: 'high' | 'medium' | 'low';
  timeline: string;
}

export interface HomeworkItem {
  questionId: string;
  controlId: string;
  question: string;
  context: string;
  assignTo?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

/**
 * Calculates score breakdown for responses
 */
export function calculateScore(
  responses: Record<string, Answer>,
  allQuestions: Question[]
): ScoreBreakdown {
  let yesCount = 0;
  let partialCount = 0;
  let noCount = 0;
  let unsureCount = 0;
  let skippedCount = 0;
  let naCount = 0;

  // Count answer types
  allQuestions.forEach(question => {
    const response = responses[question.id];
    if (!response || !response.answer) return;

    switch (response.answer) {
      case 'yes':
        yesCount++;
        break;
      case 'partial':
        partialCount++;
        break;
      case 'no':
        noCount++;
        break;
      case 'unsure':
        unsureCount++;
        break;
      case 'skipped':
        skippedCount++;
        break;
      case 'na':
        naCount++;
        break;
    }
  });

  const totalQuestions = allQuestions.length;
  const answeredQuestions = yesCount + partialCount + noCount + unsureCount;
  const applicableQuestions = totalQuestions - naCount - skippedCount;
  
  // Calculate raw score (yes = 1.0, partial = 0.5)
  const rawScore = yesCount + (partialCount * 0.5);
  const maxPossibleScore = applicableQuestions;
  const percentage = maxPossibleScore > 0 ? (rawScore / maxPossibleScore) * 100 : 0;

  return {
    totalQuestions,
    answeredQuestions,
    yesCount,
    partialCount,
    noCount,
    unsureCount,
    skippedCount,
    naCount,
    rawScore,
    maxPossibleScore,
    percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
  };
}

/**
 * Calculates domain-specific scores
 */
export function calculateDomainScores(
  responses: Record<string, Answer>,
  domains: Domain[]
): DomainScore[] {
  return domains.map(domain => {
    const domainQuestions = domain.questions || [];
    const domainScore = calculateScore(responses, domainQuestions);
    
    return {
      ...domainScore,
      domain: domain.domain,
      title: domain.title,
      level: domain.level,
    };
  });
}

/**
 * Identifies critical findings that need immediate attention
 */
export function getCriticalFindings(
  responses: Record<string, Answer>,
  allQuestions: Question[]
): Finding[] {
  const findings: Finding[] = [];
  
  // Define critical controls (Level 1 controls and key Level 2 controls)
  const criticalControlPatterns = [
    'AC.L1-3.1.1',  // Limit system access
    'AC.L1-3.1.2',  // Limit system access functions
    'IA.L1-3.5.1',  // Identify users
    'IA.L1-3.5.2',  // Authenticate users
    'SC.L1-3.13.1', // Monitor network communications
    'SI.L1-3.14.1', // Identify and correct flaws
    'SI.L1-3.14.2', // Provide malicious code protection
    'AC.L2-3.1.3',  // Control information flow
    'AC.L2-3.1.5',  // Enforce separation of duties
    'AU.L2-3.3.1',  // Create audit records
    'CM.L2-3.4.1',  // Establish configuration baselines
    'IR.L2-3.6.1',  // Establish incident response capability
    'SC.L2-3.13.8', // Implement cryptographic mechanisms
  ];
  
  allQuestions.forEach(question => {
    const response = responses[question.id];
    if (!response) return;
    
    const isCritical = criticalControlPatterns.some(pattern => 
      question.control.includes(pattern.split('-')[0])
    );
    
    // Critical findings: No answer to critical controls
    if (isCritical && response.answer === 'no') {
      findings.push({
        controlId: question.control,
        question: question.question,
        status: 'critical',
        answer: response.answer,
        impact: 'high',
        effort: getImplementationEffort(question),
        notes: response.notes,
        evidenceOrganized: response.evidenceOrganized,
        domain: question.control.split('.')[0],
      });
    }
    
    // High impact gaps: Level 1 controls with no implementation
    if (question.level === 1 && response.answer === 'no') {
      findings.push({
        controlId: question.control,
        question: question.question,
        status: 'gap',
        answer: response.answer,
        impact: 'high',
        effort: getImplementationEffort(question),
        notes: response.notes,
        evidenceOrganized: response.evidenceOrganized,
        domain: question.control.split('.')[0],
      });
    }
  });
  
  // Sort by impact and effort (high impact, low effort first)
  return findings
    .sort((a, b) => {
      const impactScore = { high: 3, medium: 2, low: 1 };
      const effortScore = { low: 3, medium: 2, high: 1 }; // Reverse for effort
      
      const scoreA = impactScore[a.impact] + effortScore[a.effort];
      const scoreB = impactScore[b.impact] + effortScore[b.effort];
      
      return scoreB - scoreA;
    })
    .slice(0, 10); // Top 10 critical findings
}

/**
 * Identifies quick wins - high impact, low effort improvements
 */
export function getQuickWins(
  responses: Record<string, Answer>,
  allQuestions: Question[]
): Finding[] {
  const quickWins: Finding[] = [];
  
  allQuestions.forEach(question => {
    const response = responses[question.id];
    if (!response) return;
    
    // Quick wins: Partial implementations that could be completed easily
    if (response.answer === 'partial') {
      const effort = getImplementationEffort(question);
      if (effort === 'low' || effort === 'medium') {
        quickWins.push({
          controlId: question.control,
          question: question.question,
          status: 'partial',
          answer: response.answer,
          impact: question.level === 1 ? 'high' : 'medium',
          effort,
          notes: response.notes,
          domain: question.control.split('.')[0],
        });
      }
    }
  });
  
  return quickWins
    .sort((a, b) => {
      const effortScore = { low: 3, medium: 2, high: 1 };
      return effortScore[b.effort] - effortScore[a.effort];
    })
    .slice(0, 5); // Top 5 quick wins
}

/**
 * Estimates implementation effort for a control
 */
function getImplementationEffort(question: Question): 'high' | 'medium' | 'low' {
  const control = question.control.toLowerCase();
  const questionText = question.question.toLowerCase();
  
  // High effort indicators
  if (
    control.includes('audit') ||
    control.includes('incident') ||
    control.includes('training') ||
    questionText.includes('policy') ||
    questionText.includes('procedure') ||
    questionText.includes('program')
  ) {
    return 'high';
  }
  
  // Low effort indicators  
  if (
    questionText.includes('password') ||
    questionText.includes('antivirus') ||
    questionText.includes('update') ||
    questionText.includes('patch') ||
    control.includes('si.l1')
  ) {
    return 'low';
  }
  
  // Default to medium
  return 'medium';
}

/**
 * Generates recommendations based on assessment results
 */
export function generateRecommendations(
  responses: Record<string, Answer>,
  allQuestions: Question[],
  scores: ScoreBreakdown
): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Basic foundational recommendations
  if (scores.percentage < 30) {
    recommendations.push({
      type: 'implementation',
      priority: 'high',
      title: 'Establish Fundamental Security Program',
      description: 'Focus on implementing basic Level 1 controls before attempting Level 2 compliance.',
      controls: ['AC.L1-3.1.1', 'IA.L1-3.5.1', 'SI.L1-3.14.1', 'SI.L1-3.14.2'],
      effort: 'high',
      timeline: '6-12 months',
    });
  }
  
  // Medium maturity recommendations
  if (scores.percentage >= 30 && scores.percentage < 70) {
    recommendations.push({
      type: 'improvement',
      priority: 'high',
      title: 'Strengthen Access Control Implementation',
      description: 'Complete partial implementations and address critical access control gaps.',
      controls: ['AC.L1-3.1.1', 'AC.L1-3.1.2', 'IA.L1-3.5.2'],
      effort: 'medium',
      timeline: '3-6 months',
    });
  }
  
  // High maturity recommendations
  if (scores.percentage >= 70) {
    recommendations.push({
      type: 'verification',
      priority: 'medium',
      title: 'Verify Implementation Effectiveness',
      description: 'Validate that implemented controls are working as intended and address any gaps.',
      controls: ['All implemented controls'],
      effort: 'low',
      timeline: '1-3 months',
    });
  }
  
  // Specific recommendations based on unsure items
  if (scores.unsureCount > 5) {
    recommendations.push({
      type: 'verification',
      priority: 'high',
      title: 'Complete Assessment Verification',
      description: `${scores.unsureCount} controls need verification. Complete the homework items to get accurate scoring.`,
      controls: ['Unsure items'],
      effort: 'low',
      timeline: '2-4 weeks',
    });
  }
  
  return recommendations.slice(0, 5); // Top 5 recommendations
}

/**
 * Generates homework items for unsure responses
 */
export function generateHomeworkItems(
  responses: Record<string, Answer>,
  allQuestions: Question[]
): HomeworkItem[] {
  const homeworkItems: HomeworkItem[] = [];
  
  allQuestions.forEach(question => {
    const response = responses[question.id];
    
    if (response?.answer === 'unsure') {
      homeworkItems.push({
        questionId: question.id,
        controlId: question.control,
        question: question.question,
        context: question.context,
        priority: question.level === 1 ? 'high' : 'medium',
        notes: response.notes,
      });
    }
  });
  
  return homeworkItems.sort((a, b) => {
    const priorityScore = { high: 3, medium: 2, low: 1 };
    return priorityScore[b.priority] - priorityScore[a.priority];
  });
}

/**
 * Generates complete assessment report
 */
export function generateAssessmentReport(
  session: Session,
  framework: Framework,
  domains: Domain[],
  allQuestions: Question[]
): AssessmentReport {
  const overview = calculateScore(session.responses, allQuestions);
  const domainScores = calculateDomainScores(session.responses, domains);
  const criticalFindings = getCriticalFindings(session.responses, allQuestions);
  const quickWins = getQuickWins(session.responses, allQuestions);
  const recommendations = generateRecommendations(session.responses, allQuestions, overview);
  const homeworkItems = generateHomeworkItems(session.responses, allQuestions);
  
  // Calculate assessment duration if completed
  let assessmentDuration: number | undefined;
  if (session.completedAt && session.startedAt) {
    assessmentDuration = Math.round(
      (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000 / 60
    ); // Duration in minutes
  }
  
  return {
    overview,
    domainScores,
    criticalFindings,
    quickWins,
    recommendations,
    homeworkItems,
    metadata: {
      sessionId: session.id,
      frameworkId: session.frameworkId,
      clientId: session.clientId,
      generatedAt: new Date().toISOString(),
      assessmentDuration,
    },
  };
}

/**
 * Exports assessment data to JSON
 */
export function exportAssessmentJSON(report: AssessmentReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Gets readiness level description
 */
export function getReadinessLevel(percentage: number): {
  level: string;
  description: string;
  color: string;
} {
  if (percentage >= 90) {
    return {
      level: 'Ready',
      description: 'Excellent compliance posture. Ready for certification assessment.',
      color: 'green',
    };
  } else if (percentage >= 80) {
    return {
      level: 'Nearly Ready',
      description: 'Strong foundation with minor gaps. Address remaining items for certification.',
      color: 'blue',
    };
  } else if (percentage >= 60) {
    return {
      level: 'Developing',
      description: 'Good progress made. Focus on critical findings and quick wins.',
      color: 'yellow',
    };
  } else if (percentage >= 40) {
    return {
      level: 'Foundation Needed',
      description: 'Basic security controls need implementation before CMMC readiness.',
      color: 'orange',
    };
  } else {
    return {
      level: 'Initial Planning',
      description: 'Significant work required. Start with fundamental security program.',
      color: 'red',
    };
  }
}