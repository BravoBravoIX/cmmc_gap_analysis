'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Shield, Menu, X, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useAssessmentStore } from '@/lib/store';
import QuestionCard from '@/components/QuestionCard';
import { Question, Domain } from '@/lib/types';

export default function AssessmentPage() {
  const { sessionId } = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const {
    currentSession,
    currentFramework,
    currentDomains,
    allQuestions,
    navigation,
    loading,
    error,
    loadSession,
    setResponse,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    setNavigation,
  } = useAssessmentStore();

  // Load session on mount
  useEffect(() => {
    if (sessionId && typeof sessionId === 'string') {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  // Auto-advance if current question is skipped
  useEffect(() => {
    if (!currentSession || !currentDomains || !allQuestions.length) return;
    
    const currentDomain = currentDomains[navigation.currentDomain];
    if (!currentDomain || !currentDomain.questions) return;
    
    const currentQuestion = currentDomain.questions[navigation.currentQuestion];
    if (!currentQuestion) return;
    
    const response = currentSession.responses[currentQuestion.id];
    if (response && response.autoSkipped) {
      // Auto-advance after a short delay
      const timer = setTimeout(() => {
        nextQuestion();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentSession, currentDomains, navigation, nextQuestion, allQuestions]);

  const handleAnswer = (answer: any) => {
    if (!currentDomains || !currentSession) return;
    
    const currentDomain = currentDomains[navigation.currentDomain];
    const currentQuestion = currentDomain?.questions?.[navigation.currentQuestion];
    
    if (currentQuestion) {
      setResponse(currentQuestion.id, answer);
      
      // Check if this will be the last question after advancing
      const isLastDomain = navigation.currentDomain === currentDomains.length - 1;
      const isLastQuestion = navigation.currentQuestion === currentDomain.questions.length - 1;
      const willComplete = isLastDomain && isLastQuestion;
      
      // Auto-advance after short delay
      setTimeout(() => {
        nextQuestion();
        
        // If assessment will be complete, redirect to reports after a brief delay
        if (willComplete) {
          setTimeout(() => {
            window.location.href = `/reports/${currentSession.id}`;
          }, 1500);
        }
      }, 800);
    }
  };

  const handleQuestionNavigation = (domainIndex: number, questionIndex: number) => {
    goToQuestion(domainIndex, questionIndex);
  };

  const getQuestionStatus = (question: Question) => {
    if (!currentSession) return 'pending';
    
    const response = currentSession.responses[question.id];
    if (!response) return 'pending';
    
    if (response.autoSkipped || response.answer === 'skipped') return 'skipped';
    if (response.autoFailed) return 'auto-failed';
    return 'answered';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'answered':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'skipped':
        return <Clock size={16} className="text-gray-400" />;
      case 'auto-failed':
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  const calculateDomainProgress = (domain: Domain) => {
    if (!domain.questions || !currentSession) return 0;
    
    const answered = domain.questions.filter(q => 
      currentSession.responses[q.id] && 
      !currentSession.responses[q.id].autoSkipped
    ).length;
    
    return Math.round((answered / domain.questions.length) * 100);
  };

  const getOverallProgress = () => {
    if (!allQuestions.length || !currentSession) return 0;
    
    const answered = allQuestions.filter(q => 
      currentSession.responses[q.id] && 
      !currentSession.responses[q.id].autoSkipped
    ).length;
    
    return Math.round((answered / allQuestions.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto text-gray-400 mb-4 animate-pulse" size={48} />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center card p-8">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Assessment</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (!currentSession || !currentFramework || !currentDomains || !allQuestions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">Preparing assessment...</p>
        </div>
      </div>
    );
  }

  const currentDomain = currentDomains[navigation.currentDomain];
  const currentQuestion = currentDomain?.questions?.[navigation.currentQuestion];
  
  if (!currentDomain || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center card p-8">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Assessment Complete!</h1>
          <p className="text-gray-600 mb-4">All questions have been answered.</p>
          <button 
            onClick={() => window.location.href = `/reports/${sessionId}`}
            className="btn-primary"
          >
            View Results
          </button>
        </div>
      </div>
    );
  }

  const currentQuestionIndex = currentDomains
    .slice(0, navigation.currentDomain)
    .reduce((total, domain) => total + (domain.questions?.length || 0), 0) + 
    navigation.currentQuestion + 1;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Shield className="text-gray-700 mr-2" size={24} />
              <div>
                <h2 className="font-semibold text-gray-800">{currentFramework.name}</h2>
                <p className="text-sm text-gray-600">{currentSession.mode} mode</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          </div>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{getOverallProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-700 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getOverallProgress()}%` }}
              />
            </div>
          </div>

          {/* Domain Navigation */}
          <div className="space-y-4">
            {currentDomains.map((domain, domainIndex) => (
              <div key={domain.domain} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-800 text-sm">{domain.title}</h3>
                  <span className="text-xs text-gray-500">{calculateDomainProgress(domain)}%</span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-1 mb-3">
                  <div
                    className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${calculateDomainProgress(domain)}%` }}
                  />
                </div>

                {/* Questions in Domain */}
                <div className="space-y-1">
                  {domain.questions?.map((question, questionIndex) => {
                    const status = getQuestionStatus(question);
                    const isCurrentQuestion = domainIndex === navigation.currentDomain && 
                                            questionIndex === navigation.currentQuestion;
                    
                    return (
                      <button
                        key={question.id}
                        onClick={() => handleQuestionNavigation(domainIndex, questionIndex)}
                        className={`w-full flex items-center p-2 rounded text-left transition-colors
                          ${isCurrentQuestion 
                            ? 'bg-gray-100 border border-gray-300' 
                            : 'hover:bg-gray-50'
                          }`}
                      >
                        <div className="mr-3">
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-gray-700 truncate">
                            {question.control}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {question.question}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {!sidebarOpen && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="text-gray-500 hover:text-gray-700 mr-4"
                >
                  <Menu size={20} />
                </button>
              )}
              <div>
                <h1 className="font-semibold text-gray-800">
                  {currentFramework.name} Assessment
                </h1>
                <p className="text-sm text-gray-600">
                  Question {currentQuestionIndex} of {allQuestions.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Progress</div>
                <div className="font-semibold text-gray-700">{getOverallProgress()}%</div>
              </div>
              
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gray-700 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getOverallProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <QuestionCard
              question={currentQuestion}
              domainTitle={currentDomain.title}
              onAnswer={handleAnswer}
              onNext={nextQuestion}
              onPrevious={previousQuestion}
              existingAnswer={currentSession.responses[currentQuestion.id]}
              currentResponses={currentSession.responses}
              allQuestions={allQuestions}
              canGoNext={currentQuestionIndex < allQuestions.length}
              canGoPrevious={currentQuestionIndex > 1}
              isFirst={currentQuestionIndex === 1}
              isLast={currentQuestionIndex === allQuestions.length}
              questionNumber={currentQuestionIndex}
              totalQuestions={allQuestions.length}
              assessmentMode={currentSession.mode}
            />
          </div>
        </div>
      </div>
    </div>
  );
}