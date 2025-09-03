'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  FileText, 
  Download,
  Home,
  ChevronRight,
  Target,
  Zap,
  AlertCircle,
  Package
} from 'lucide-react';
import { useAssessmentStore } from '@/lib/store';
import { getClient } from '@/lib/clientUtils';
import { 
  generateAssessmentReport, 
  exportAssessmentJSON, 
  getReadinessLevel,
  AssessmentReport,
  Finding,
  Recommendation 
} from '@/lib/scoringUtils';
import { Client } from '@/lib/types';
import ExportButtons from '@/components/ExportButtons';

export default function ReportPage() {
  const { sessionId } = useParams();
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'findings' | 'homework' | 'recommendations'>('overview');

  const {
    currentSession,
    currentFramework,
    currentDomains,
    allQuestions,
    loadSession,
    setCurrentFramework,
  } = useAssessmentStore();

  // Load session and generate report
  useEffect(() => {
    const loadReport = async () => {
      if (!sessionId || typeof sessionId !== 'string') return;

      try {
        // Load session if not already loaded
        if (!currentSession || currentSession.id !== sessionId) {
          await loadSession(sessionId);
          return; // Will trigger this effect again when session loads
        }

        // Load framework if not loaded
        if (!currentFramework || currentFramework.id !== currentSession.frameworkId) {
          await setCurrentFramework(currentSession.frameworkId);
          return;
        }

        // Load client
        const clientData = getClient(currentSession.clientId);
        setClient(clientData);

        // Generate report
        if (currentDomains && allQuestions.length > 0) {
          const reportData = generateAssessmentReport(
            currentSession,
            currentFramework,
            currentDomains,
            allQuestions
          );
          setReport(reportData);
        }
      } catch (error) {
        console.error('Failed to load report:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [sessionId, currentSession, currentFramework, currentDomains, allQuestions, loadSession, setCurrentFramework]);

  const [bulkExporting, setBulkExporting] = useState(false);

  const handleExportJSON = () => {
    if (!report) return;

    const jsonData = exportAssessmentJSON(report);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${client?.companyName || 'Assessment'}_${currentFramework?.name || 'Report'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkExport = async (format: 'pdf' | 'docx') => {
    setBulkExporting(true);
    
    try {
      const response = await fetch('/api/export/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          sessionId: sessionId as string,
          sessionData: currentSession,
          clientData: client,
          reportTypes: ['executive', 'technical', 'homework', 'progress', 'certification']
        }),
      });

      if (!response.ok) {
        throw new Error('Bulk export failed');
      }

      // Get the filename from the response header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename="')[1]?.split('"')[0]
        : `reports.zip`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      console.error('Bulk export failed:', error);
      alert('Bulk export failed. Please try again.');
    } finally {
      setBulkExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'gap': return 'text-orange-600 bg-orange-50';
      case 'partial': return 'text-yellow-600 bg-yellow-50';
      case 'compliant': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  if (!report || !client || !currentFramework) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center card p-8">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Report Not Available</h1>
          <p className="text-gray-600 mb-4">Unable to generate assessment report</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary"
          >
            <Home className="mr-2" size={16} />
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const readiness = getReadinessLevel(report.overview.percentage);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <img 
                src="/CyberOps-Logo-Large.png" 
                alt="Company Logo" 
                className="h-12 w-auto mr-4"
              />
              <div className="border-l border-gray-300 pl-4">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <button 
                    onClick={() => window.location.href = '/'}
                    className="hover:text-gray-700"
                  >
                    Home
                  </button>
                  <ChevronRight size={16} className="mx-2" />
                  <span>Assessment Report</span>
                </div>
                <h1 className="text-2xl font-semibold text-gray-800">{client.companyName}</h1>
                <p className="text-gray-600">{currentFramework.name} Assessment Report</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-lg ${
                readiness.color === 'green' ? 'bg-green-100 text-green-700' :
                readiness.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                readiness.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                readiness.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                <div className="font-semibold">{readiness.level}</div>
                <div className="text-sm">{Math.round(report.overview.percentage)}% Ready</div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleBulkExport('pdf')}
                  disabled={bulkExporting}
                  className="btn-secondary flex items-center text-sm"
                >
                  {bulkExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Package size={14} className="mr-1" />
                      All PDF
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleBulkExport('docx')}
                  disabled={bulkExporting}
                  className="btn-secondary flex items-center text-sm"
                >
                  {bulkExporting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Package size={14} className="mr-1" />
                      All Word
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleExportJSON}
                  className="btn-secondary flex items-center text-sm"
                >
                  <Download size={14} className="mr-1" />
                  JSON
                </button>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex space-x-8 mt-6">
            {[
              { key: 'overview', label: 'Overview', icon: Shield },
              { key: 'findings', label: 'Findings', icon: AlertTriangle },
              { key: 'recommendations', label: 'Recommendations', icon: Target },
              { key: 'homework', label: 'Follow-up', icon: Clock },
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center pb-3 border-b-2 transition-colors ${
                    activeTab === tab.key
                      ? 'border-gray-700 text-gray-800'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Icon size={16} className="mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Tab Export Buttons */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Executive Summary</h2>
              <ExportButtons 
                sessionId={sessionId as string}
                reportType="executive"
                className="ml-4"
              />
            </div>
            {/* Score Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-gray-800">{Math.round(report.overview.percentage)}%</div>
                <div className="text-sm text-gray-600">Overall Score</div>
                <div className="text-xs text-gray-500 mt-1">
                  {report.overview.rawScore} / {report.overview.maxPossibleScore}
                </div>
              </div>
              
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-green-600">{report.overview.yesCount}</div>
                <div className="text-sm text-gray-600">Implemented</div>
                <div className="text-xs text-gray-500 mt-1">Ready controls</div>
              </div>
              
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-yellow-600">{report.overview.partialCount}</div>
                <div className="text-sm text-gray-600">Partial</div>
                <div className="text-xs text-gray-500 mt-1">Needs improvement</div>
              </div>
              
              <div className="card p-6 text-center">
                <div className="text-3xl font-bold text-red-600">{report.overview.noCount}</div>
                <div className="text-sm text-gray-600">Gaps</div>
                <div className="text-xs text-gray-500 mt-1">Need implementation</div>
              </div>
            </div>

            {/* Readiness Assessment */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Readiness Assessment</h2>
              <div className={`p-4 rounded-lg ${
                readiness.color === 'green' ? 'bg-green-50' :
                readiness.color === 'blue' ? 'bg-blue-50' :
                readiness.color === 'yellow' ? 'bg-yellow-50' :
                readiness.color === 'orange' ? 'bg-orange-50' :
                'bg-red-50'
              }`}>
                <div className="flex items-center mb-2">
                  <Shield className={`mr-3 ${
                    readiness.color === 'green' ? 'text-green-600' :
                    readiness.color === 'blue' ? 'text-blue-600' :
                    readiness.color === 'yellow' ? 'text-yellow-600' :
                    readiness.color === 'orange' ? 'text-orange-600' :
                    'text-red-600'
                  }`} size={24} />
                  <h3 className="text-xl font-semibold text-gray-800">{readiness.level}</h3>
                </div>
                <p className="text-gray-700">{readiness.description}</p>
              </div>
            </div>

            {/* Domain Breakdown */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Domain Scores</h2>
              <div className="space-y-4">
                {report.domainScores.map(domain => (
                  <div key={domain.domain} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-800">{domain.title}</h3>
                      <span className="text-sm font-semibold text-gray-700">
                        {Math.round(domain.percentage)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div
                        className="bg-gray-700 h-2 rounded-full"
                        style={{ width: `${domain.percentage}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{domain.yesCount} Yes • {domain.partialCount} Partial • {domain.noCount} No</span>
                      <span>{domain.answeredQuestions} / {domain.totalQuestions} answered</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Findings Tab */}
        {activeTab === 'findings' && (
          <div className="space-y-8">
            {/* Tab Export Buttons */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Technical Findings</h2>
              <ExportButtons 
                sessionId={sessionId as string}
                reportType="technical"
                className="ml-4"
              />
            </div>
            {/* Critical Findings */}
            <div className="card p-6">
              <div className="flex items-center mb-6">
                <AlertTriangle className="text-red-600 mr-3" size={24} />
                <h2 className="text-lg font-semibold text-gray-800">Critical Findings</h2>
                <span className="ml-2 bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
                  {report.criticalFindings.length}
                </span>
              </div>

              {report.criticalFindings.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto text-green-500 mb-3" size={32} />
                  <p className="text-gray-600">No critical findings identified!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {report.criticalFindings.map((finding, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-gray-800 mr-2">{finding.controlId}</span>
                            <span className={`text-xs px-2 py-1 rounded ${getStatusColor(finding.status)}`}>
                              {finding.status}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{finding.question}</p>
                          {finding.notes && (
                            <p className="text-gray-600 text-xs">{finding.notes}</p>
                          )}
                        </div>
                        <div className="text-right text-xs text-gray-500 ml-4">
                          <div>Impact: <span className="capitalize">{finding.impact}</span></div>
                          <div>Effort: <span className="capitalize">{finding.effort}</span></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Wins */}
            <div className="card p-6">
              <div className="flex items-center mb-6">
                <Zap className="text-green-600 mr-3" size={24} />
                <h2 className="text-lg font-semibold text-gray-800">Quick Wins</h2>
                <span className="ml-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                  {report.quickWins.length}
                </span>
              </div>

              {report.quickWins.length === 0 ? (
                <p className="text-gray-600 text-center py-4">No quick wins identified</p>
              ) : (
                <div className="space-y-4">
                  {report.quickWins.map((finding, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className="font-medium text-gray-800 mr-2">{finding.controlId}</span>
                            <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded">
                              Partial Implementation
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{finding.question}</p>
                        </div>
                        <div className="text-right text-xs text-gray-500 ml-4">
                          <div className="text-green-600 font-medium">Low Effort</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-6">
            {/* Tab Export Buttons */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Progress Report</h2>
              <ExportButtons 
                sessionId={sessionId as string}
                reportType="progress"
                className="ml-4"
              />
            </div>
            
            <div className="card p-6">
              <div className="flex items-center mb-6">
                <Target className="text-blue-600 mr-3" size={24} />
                <h2 className="text-lg font-semibold text-gray-800">Recommendations</h2>
              </div>

            <div className="space-y-6">
              {report.recommendations.map((rec, index) => (
                <div key={index} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-800">{rec.title}</h3>
                    <div className="flex space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(rec.priority)}`}>
                        {rec.priority} priority
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded capitalize">
                        {rec.type}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-4">{rec.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Estimated Effort:</span>
                      <span className="ml-2 capitalize font-medium">{rec.effort}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Timeline:</span>
                      <span className="ml-2 font-medium">{rec.timeline}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          </div>
        )}

        {/* Homework Tab */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            {/* Tab Export Buttons */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Homework Assignment</h2>
              <ExportButtons 
                sessionId={sessionId as string}
                reportType="homework"
                className="ml-4"
              />
            </div>
            
            <div className="card p-6">
              <div className="flex items-center mb-6">
                <Clock className="text-yellow-600 mr-3" size={24} />
                <h2 className="text-lg font-semibold text-gray-800">Follow-up Items</h2>
                <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">
                  {report.homeworkItems.length}
                </span>
              </div>

            {report.homeworkItems.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto text-green-500 mb-3" size={32} />
                <p className="text-gray-600">No follow-up items needed!</p>
                <p className="text-gray-500 text-sm mt-1">All questions were answered with confidence</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600 mb-4">
                  The following items need verification or additional information:
                </p>
                
                {report.homeworkItems.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="font-medium text-gray-800 mr-2">{item.controlId}</span>
                          <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)}`}>
                            {item.priority} priority
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm mb-1">{item.question}</p>
                        <p className="text-gray-600 text-xs">{item.context}</p>
                        {item.notes && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <strong>Notes:</strong> {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}