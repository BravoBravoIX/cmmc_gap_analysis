'use client';

import { useEffect, useState } from 'react';
import { Shield, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAssessmentStore } from '@/lib/store';
import { Framework, Client } from '@/lib/types';
import { createClient, getClient } from '@/lib/clientUtils';

export default function TestPage() {
  const [testSessionId, setTestSessionId] = useState<string | null>(null);
  
  const {
    frameworks,
    loading,
    error,
    loadFrameworks,
    createSession,
  } = useAssessmentStore();

  // Load frameworks on mount
  useEffect(() => {
    loadFrameworks();
  }, [loadFrameworks]);

  const handleTestAssessment = async (frameworkId: string) => {
    try {
      // Check if test client exists, otherwise create one
      let testClient;
      try {
        testClient = await getClient('test-client');
      } catch (error) {
        // Test client doesn't exist, create it
        const testClientData = {
          companyName: 'Test Company',
          industry: 'technology',
          contactName: 'Test User',
          contactEmail: 'test@example.com',
          contactPhone: '555-0123',
          contactTitle: 'IT Manager',
          companySize: 'small',
          handlesCUI: false,
          hasGovernmentContracts: true
        };
        testClient = await createClient(testClientData, 'test-client');
      }

      const session = await createSession(testClient.id, frameworkId, 'quick');
      setTestSessionId(session.id);
      // Redirect to assessment
      window.location.href = `/assessment/${session.id}`;
    } catch (error) {
      console.error('Failed to create test session:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="card p-8 mb-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">
                  Framework Testing
                </h1>
                <p className="text-gray-600">
                  Test CMMC frameworks and assessments
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Shield className="text-gray-600" size={32} />
                  <img 
                    src="/CyberOps-Logo-Large.png" 
                    alt="Company Logo" 
                    className="w-20 h-20 object-contain"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => window.location.href = '/'}
                    className="btn-secondary text-sm"
                  >
                    Back to Dashboard
                  </button>
                  <button
                    onClick={() => window.location.href = '/assessment/new'}
                    className="btn-primary text-sm"
                  >
                    New Assessment
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="font-semibold text-gray-800 mb-4">
              About Framework Testing
            </h2>
            <div className="text-gray-700 space-y-3">
              <p>
                This page allows you to test CMMC frameworks directly without creating clients first.
                Perfect for testing and demonstration purposes.
              </p>
              <p>
                <strong>How it works:</strong> Select a framework below to begin a quick assessment. 
                The tool will guide you through control-based questions to identify gaps and provide 
                detailed reporting on your current security posture.
              </p>
              <p>
                <strong>Assessment Types:</strong> Quick assessments focus on core compliance requirements, 
                while detailed assessments provide comprehensive analysis with evidence tracking.
              </p>
            </div>
          </div>

          {/* Framework Status */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Frameworks</h2>
            
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-4">Loading frameworks...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="text-red-500 mr-2" size={20} />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {!loading && !error && frameworks.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {frameworks.map((framework: Framework) => (
                  <div key={framework.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{framework.name}</h3>
                        <p className="text-sm text-gray-600">{framework.description}</p>
                      </div>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        framework.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                        framework.color === 'green' ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {framework.mode || 'Standard'}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500 mb-4">
                      <p>• {framework.totalControls} controls</p>
                      <p>• ~{framework.estimatedTime} minutes</p>
                      <p>• {framework.domains?.length || 0} domains</p>
                    </div>
                    
                    <button
                      onClick={() => handleTestAssessment(framework.id)}
                      className="w-full btn-primary"
                    >
                      Test Assessment
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && frameworks.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600">No frameworks found. Check your configuration.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}