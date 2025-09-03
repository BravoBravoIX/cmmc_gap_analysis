// Adaptive logic for handling question dependencies

import { Question, Answer } from './types';

/**
 * Handles adaptive logic for question dependencies
 * Returns updated responses based on dependency rules
 */
export function handleAdaptiveLogic(
  question: Question,
  answer: string,
  allQuestions: Question[],
  currentResponses: Record<string, Answer>
): {
  updatedResponses: Record<string, Answer>;
  skippedQuestions: string[];
  autoFailedQuestions: string[];
} {
  const updatedResponses = { ...currentResponses };
  const skippedQuestions: string[] = [];
  const autoFailedQuestions: string[] = [];
  
  if (!question.dependencies) {
    return { updatedResponses, skippedQuestions, autoFailedQuestions };
  }
  
  const deps = question.dependencies;
  const timestamp = new Date().toISOString();
  
  // Handle auto-fail dependencies
  if (answer === 'no' && deps.autoFail) {
    for (const questionId of deps.autoFail) {
      const targetQuestion = allQuestions.find(q => q.id === questionId);
      if (targetQuestion) {
        updatedResponses[questionId] = {
          answer: 'no',
          autoFailed: true,
          skipReason: `Auto-failed because ${question.control} (${question.id}) is No`,
          timestamp,
          controlId: targetQuestion.control,
          questionId: questionId,
          notes: `Automatically marked as 'No' based on dependency from ${question.control}`,
          confidence: 'high',
        };
        autoFailedQuestions.push(questionId);
      }
    }
  }
  
  // Handle skip-if-no dependencies
  if (answer === 'no' && deps.skipIfNo) {
    for (const questionId of deps.skipIfNo) {
      const targetQuestion = allQuestions.find(q => q.id === questionId);
      if (targetQuestion) {
        updatedResponses[questionId] = {
          answer: 'skipped',
          autoSkipped: true,
          skipReason: `Skipped because ${question.control} (${question.id}) is No`,
          timestamp,
          controlId: targetQuestion.control,
          questionId: questionId,
          notes: `Automatically skipped based on dependency from ${question.control}`,
        };
        skippedQuestions.push(questionId);
      }
    }
  }
  
  // Handle skip-if-NA dependencies
  if (answer === 'na' && deps.skipIfNA) {
    for (const questionId of deps.skipIfNA) {
      const targetQuestion = allQuestions.find(q => q.id === questionId);
      if (targetQuestion) {
        updatedResponses[questionId] = {
          answer: 'skipped',
          autoSkipped: true,
          skipReason: `Skipped because ${question.control} (${question.id}) is Not Applicable`,
          timestamp,
          controlId: targetQuestion.control,
          questionId: questionId,
          notes: `Automatically skipped - not applicable based on ${question.control}`,
        };
        skippedQuestions.push(questionId);
      }
    }
  }
  
  // Handle enabling dependencies (reverse logic - if this becomes 'no', check if enabled questions should be reverted)
  if (answer === 'no' && deps.enables) {
    for (const questionId of deps.enables) {
      const existingResponse = updatedResponses[questionId];
      if (existingResponse && !existingResponse.autoFailed && !existingResponse.autoSkipped) {
        // Question was manually answered, don't override
        continue;
      }
      
      // Check if there are other questions that could enable this one
      const otherEnablers = allQuestions.filter(q => 
        q.id !== question.id && 
        q.dependencies?.enables?.includes(questionId) &&
        currentResponses[q.id]?.answer === 'yes'
      );
      
      if (otherEnablers.length === 0) {
        // No other enablers, so this question should be marked as not applicable
        const targetQuestion = allQuestions.find(q => q.id === questionId);
        if (targetQuestion) {
          updatedResponses[questionId] = {
            answer: 'skipped',
            autoSkipped: true,
            skipReason: `Skipped because enabling control ${question.control} is No`,
            timestamp,
            controlId: targetQuestion.control,
            questionId: questionId,
            notes: `No longer applicable - enabling control ${question.control} is not implemented`,
          };
          skippedQuestions.push(questionId);
        }
      }
    }
  }
  
  return { updatedResponses, skippedQuestions, autoFailedQuestions };
}

/**
 * Validates that required dependencies are met before allowing an answer
 */
export function validateDependencies(
  question: Question,
  answer: string,
  currentResponses: Record<string, Answer>
): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!question.dependencies) {
    return { valid: true, errors, warnings };
  }
  
  const deps = question.dependencies;
  
  // Check required dependencies
  if (deps.requires) {
    for (const requiredQuestionId of deps.requires) {
      const requiredResponse = currentResponses[requiredQuestionId];
      if (!requiredResponse) {
        warnings.push(`Question ${requiredQuestionId} should be answered first`);
      } else if (requiredResponse.answer === 'no') {
        if (answer === 'yes') {
          errors.push(`Cannot answer 'Yes' - required control ${requiredQuestionId} is not implemented`);
        }
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets the dependency status for a question
 */
export function getDependencyStatus(
  question: Question,
  currentResponses: Record<string, Answer>
): {
  shouldSkip: boolean;
  shouldAutoFail: boolean;
  canAnswer: boolean;
  reason?: string;
} {
  if (!question.dependencies) {
    return { shouldSkip: false, shouldAutoFail: false, canAnswer: true };
  }
  
  const deps = question.dependencies;
  
  // Check if this question should be auto-failed
  if (deps.autoFail) {
    // This would be handled by the parent question's logic
  }
  
  // Check if this question should be skipped
  if (deps.skipIfNo || deps.skipIfNA) {
    // This would be handled by the parent question's logic
  }
  
  // Check if required dependencies are met
  if (deps.requires) {
    for (const requiredQuestionId of deps.requires) {
      const requiredResponse = currentResponses[requiredQuestionId];
      if (!requiredResponse) {
        return {
          shouldSkip: false,
          shouldAutoFail: false,
          canAnswer: false,
          reason: `Please answer question ${requiredQuestionId} first`,
        };
      }
      if (requiredResponse.answer === 'no') {
        return {
          shouldSkip: false,
          shouldAutoFail: true,
          canAnswer: false,
          reason: `Auto-failed because required control ${requiredQuestionId} is not implemented`,
        };
      }
    }
  }
  
  return { shouldSkip: false, shouldAutoFail: false, canAnswer: true };
}

/**
 * Gets questions that would be affected if this question's answer changes
 */
export function getAffectedQuestions(
  question: Question,
  newAnswer: string,
  allQuestions: Question[]
): {
  wouldSkip: Question[];
  wouldAutoFail: Question[];
  wouldEnable: Question[];
} {
  const wouldSkip: Question[] = [];
  const wouldAutoFail: Question[] = [];
  const wouldEnable: Question[] = [];
  
  if (!question.dependencies) {
    return { wouldSkip, wouldAutoFail, wouldEnable };
  }
  
  const deps = question.dependencies;
  
  if (newAnswer === 'no') {
    // Find questions that would be auto-failed
    if (deps.autoFail) {
      for (const questionId of deps.autoFail) {
        const affectedQuestion = allQuestions.find(q => q.id === questionId);
        if (affectedQuestion) {
          wouldAutoFail.push(affectedQuestion);
        }
      }
    }
    
    // Find questions that would be skipped
    if (deps.skipIfNo) {
      for (const questionId of deps.skipIfNo) {
        const affectedQuestion = allQuestions.find(q => q.id === questionId);
        if (affectedQuestion) {
          wouldSkip.push(affectedQuestion);
        }
      }
    }
  }
  
  if (newAnswer === 'na') {
    // Find questions that would be skipped due to N/A
    if (deps.skipIfNA) {
      for (const questionId of deps.skipIfNA) {
        const affectedQuestion = allQuestions.find(q => q.id === questionId);
        if (affectedQuestion) {
          wouldSkip.push(affectedQuestion);
        }
      }
    }
  }
  
  if (newAnswer === 'yes') {
    // Find questions that would be enabled
    if (deps.enables) {
      for (const questionId of deps.enables) {
        const affectedQuestion = allQuestions.find(q => q.id === questionId);
        if (affectedQuestion) {
          wouldEnable.push(affectedQuestion);
        }
      }
    }
  }
  
  return { wouldSkip, wouldAutoFail, wouldEnable };
}