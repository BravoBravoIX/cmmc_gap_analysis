'use client';

import { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  MinusCircle,
  Info, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { Question, Answer, AnswerOption } from '@/lib/types';
import { validateDependencies, getAffectedQuestions } from '@/lib/adaptiveLogic';

interface QuestionCardProps {
  question: Question;
  domainTitle: string;
  onAnswer: (answer: Answer) => void;
  onNext: () => void;
  onPrevious: () => void;
  existingAnswer?: Answer;
  currentResponses: Record<string, Answer>;
  allQuestions: Question[];
  canGoNext: boolean;
  canGoPrevious: boolean;
  isFirst: boolean;
  isLast: boolean;
  questionNumber: number;
  totalQuestions: number;
  assessmentMode: 'quick' | 'detailed';
}

const defaultAnswerOptions: AnswerOption[] = [
  { 
    value: 'yes', 
    label: 'Yes', 
    subtext: 'We have this', 
    icon: 'CheckCircle', 
    color: 'text-green-600', 
    score: 1.0 
  },
  { 
    value: 'partial', 
    label: 'Partial', 
    subtext: 'Some but not all', 
    icon: 'Clock', 
    color: 'text-yellow-600', 
    score: 0.5 
  },
  { 
    value: 'no', 
    label: 'No', 
    subtext: 'Not in place', 
    icon: 'XCircle', 
    color: 'text-red-600', 
    score: 0.0 
  },
  { 
    value: 'unsure', 
    label: 'Not Sure', 
    subtext: 'Need to verify', 
    icon: 'AlertCircle', 
    color: 'text-gray-500', 
    score: 0.0, 
    requiresFollowUp: true 
  },
  { 
    value: 'na', 
    label: 'N/A', 
    subtext: 'Not applicable', 
    icon: 'MinusCircle', 
    color: 'text-gray-500', 
    score: 0, 
    excluded: true 
  }
];

const iconMap = {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  MinusCircle,
};

export default function QuestionCard({
  question,
  domainTitle,
  onAnswer,
  onNext,
  onPrevious,
  existingAnswer,
  currentResponses,
  allQuestions,
  canGoNext,
  canGoPrevious,
  isFirst,
  isLast,
  questionNumber,
  totalQuestions,
  assessmentMode,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState(existingAnswer?.answer || '');
  const [notes, setNotes] = useState(existingAnswer?.notes || '');
  const [confidence, setConfidence] = useState(existingAnswer?.confidence || 'medium');
  const [evidenceOrganized, setEvidenceOrganized] = useState(existingAnswer?.evidenceOrganized || false);
  const [timelineEstimate, setTimelineEstimate] = useState('');
  const [showAffectedQuestions, setShowAffectedQuestions] = useState(false);

  // Update local state when existingAnswer changes
  useEffect(() => {
    setSelectedAnswer(existingAnswer?.answer || '');
    setNotes(existingAnswer?.notes || '');
    setConfidence(existingAnswer?.confidence || 'medium');
    setEvidenceOrganized(existingAnswer?.evidenceOrganized || false);
  }, [existingAnswer]);

  // Validate dependencies for current answer
  const dependencyValidation = selectedAnswer 
    ? validateDependencies(question, selectedAnswer, currentResponses)
    : { valid: true, errors: [], warnings: [] };

  // Get questions that would be affected by this answer
  const affectedQuestions = selectedAnswer 
    ? getAffectedQuestions(question, selectedAnswer, allQuestions)
    : { wouldSkip: [], wouldAutoFail: [], wouldEnable: [] };

  const hasAffectedQuestions = 
    affectedQuestions.wouldSkip.length > 0 || 
    affectedQuestions.wouldAutoFail.length > 0 || 
    affectedQuestions.wouldEnable.length > 0;

  const handleAnswerSelect = (answerValue: string) => {
    setSelectedAnswer(answerValue);
    setShowAffectedQuestions(true);
    
    // Auto-hide affected questions preview after 3 seconds
    setTimeout(() => setShowAffectedQuestions(false), 3000);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;

    const answer: Answer = {
      answer: selectedAnswer as any,
      notes,
      confidence,
      evidenceOrganized,
      timestamp: new Date().toISOString(),
      controlId: question.control,
      questionId: question.id,
    };

    onAnswer(answer);
    
    // If this is the last question, trigger completion
    if (isLast) {
      onNext(); // This will complete the assessment via the store's nextQuestion function
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && selectedAnswer) {
      handleSubmit();
    } else if (e.key === 'ArrowLeft' && canGoPrevious) {
      onPrevious();
    } else if (e.key === 'ArrowRight' && canGoNext && selectedAnswer) {
      onNext();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnswer, canGoNext, canGoPrevious]);

  return (
    <div className="card p-8">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">{domainTitle}</h2>
          <p className="text-sm text-gray-600">
            Question {questionNumber} of {totalQuestions}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Progress</div>
          <div className="text-lg font-semibold text-gray-700">
            {Math.round((questionNumber / totalQuestions) * 100)}%
          </div>
        </div>
      </div>

      {/* Control Reference */}
      <div className="mb-4">
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded">
          Control {question.control}
        </span>
        {question.level && (
          <span className="ml-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
            Level {question.level}
          </span>
        )}
      </div>

      {/* Question */}
      <h3 className="text-xl font-medium text-gray-800 mb-4">
        {question.question}
      </h3>

      {/* Context Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-start mb-2">
          <Info className="text-blue-600 mr-2 mt-0.5 flex-shrink-0" size={16} />
          <div>
            <div className="text-sm font-medium text-blue-900 mb-1">What this means:</div>
            <div className="text-sm text-blue-800">{question.context}</div>
          </div>
        </div>
        <div className="ml-6 mt-3">
          <div className="text-xs font-medium text-blue-700 mb-1">Examples:</div>
          <div className="text-xs text-blue-700">{question.examples}</div>
        </div>
      </div>

      {/* Consultant Question */}
      <div className="bg-gray-50 rounded-lg p-3 mb-6">
        <div className="text-sm text-gray-700">
          <span className="font-medium">Question:</span> {question.followUp}
        </div>
      </div>

      {/* Dependency Warnings/Errors */}
      {!dependencyValidation.valid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <div className="text-sm font-medium text-red-800 mb-1">Dependencies:</div>
          {dependencyValidation.errors.map((error, index) => (
            <div key={index} className="text-sm text-red-700">• {error}</div>
          ))}
        </div>
      )}

      {dependencyValidation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="text-sm font-medium text-yellow-800 mb-1">Recommendations:</div>
          {dependencyValidation.warnings.map((warning, index) => (
            <div key={index} className="text-sm text-yellow-700">• {warning}</div>
          ))}
        </div>
      )}

      {/* Answer Options */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {defaultAnswerOptions.map((option) => {
          const IconComponent = iconMap[option.icon as keyof typeof iconMap];
          const isSelected = selectedAnswer === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleAnswerSelect(option.value)}
              disabled={!dependencyValidation.valid && option.value === 'yes'}
              className={`p-4 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-gray-700 bg-gray-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }
                ${!dependencyValidation.valid && option.value === 'yes' 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer'
                }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <IconComponent className={option.color} size={20} />
                  <div className="ml-3 text-left">
                    <div className="font-medium text-gray-700">{option.label}</div>
                    <div className="text-xs text-gray-500">{option.subtext}</div>
                  </div>
                </div>
                {isSelected && (
                  <CheckCircle className="text-gray-700" size={16} />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Affected Questions Preview */}
      {showAffectedQuestions && hasAffectedQuestions && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="text-sm font-medium text-yellow-800 mb-2">
            This answer will affect other questions:
          </div>
          <div className="text-xs text-yellow-700 space-y-1">
            {affectedQuestions.wouldAutoFail.map((q) => (
              <div key={q.id}>• {q.control} will be marked as "No"</div>
            ))}
            {affectedQuestions.wouldSkip.map((q) => (
              <div key={q.id}>• {q.control} will be skipped</div>
            ))}
            {affectedQuestions.wouldEnable.map((q) => (
              <div key={q.id}>• {q.control} will become available</div>
            ))}
          </div>
        </div>
      )}

      {/* Assessment Mode Specific Fields */}
      {assessmentMode === 'quick' ? (
        /* Quick Mode - Minimal additional fields */
        <div className="mb-6 space-y-4">
          {/* Optional notes - smaller */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Quick notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input text-sm"
              placeholder="Brief notes if needed..."
            />
          </div>
        </div>
      ) : (
        /* Detailed Mode - Comprehensive fields */
        <div className="mb-6 space-y-6">
          {/* Confidence Level - More prominent in detailed mode */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <label className="block text-sm font-semibold text-blue-900 mb-3">
              Response Confidence Level
            </label>
            <div className="flex gap-3">
              {[
                { level: 'low', emoji: '', desc: 'Uncertain - needs verification' },
                { level: 'medium', emoji: '', desc: 'Moderately confident' },
                { level: 'high', emoji: '', desc: 'Very confident in answer' }
              ].map(({ level, emoji, desc }) => (
                <button
                  key={level}
                  onClick={() => setConfidence(level as any)}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-sm ${
                    confidence === level
                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className="font-medium">{emoji} {level.charAt(0).toUpperCase() + level.slice(1)}</div>
                  <div className="text-xs opacity-80">{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Detailed Notes Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📝 Implementation Notes & Context
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input resize-none"
              rows={4}
              placeholder="Detailed implementation notes, who to contact, evidence locations, current status, next steps..."
            />
          </div>

          {/* Evidence Organization */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={evidenceOrganized}
                onChange={(e) => setEvidenceOrganized(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Evidence is organized and available for audit
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Check this box if you have the necessary documentation, policies, and evidence organized for this control.
            </p>
          </div>

          {/* Implementation Timeline Estimate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⏱️ Implementation Timeline (if not implemented)
            </label>
            <select
              value={timelineEstimate}
              onChange={(e) => setTimelineEstimate(e.target.value)}
              className="input text-sm"
            >
              <option value="">Select timeline estimate...</option>
              <option value="immediate">Immediate (1-2 days)</option>
              <option value="short">Short-term (1-2 weeks)</option>
              <option value="medium">Medium-term (1-3 months)</option>
              <option value="long">Long-term (3+ months)</option>
              <option value="complex">Complex project (6+ months)</option>
            </select>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={onPrevious}
          disabled={!canGoPrevious}
          className={`flex items-center px-4 py-2 rounded font-medium transition-colors
            ${!canGoPrevious
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
        >
          <ChevronLeft className="mr-1" size={20} />
          Previous
        </button>

        <div className="text-sm text-gray-500">
          Press Enter to save • Arrow keys to navigate
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedAnswer || !dependencyValidation.valid}
          className={`flex items-center px-6 py-2 rounded font-medium transition-colors
            ${!selectedAnswer || !dependencyValidation.valid
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
        >
          {isLast ? 'Complete Assessment' : 'Save and Continue'}
          {!isLast && <ChevronRight className="ml-1" size={20} />}
        </button>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 space-x-4">
          <span>← → Navigate</span>
          <span>↵ Save</span>
          <span>1-5 Quick select</span>
        </div>
      </div>
    </div>
  );
}