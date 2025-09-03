'use client';

import { useState, useEffect } from 'react';
import { Shield, User, Clock, CheckCircle, Plus } from 'lucide-react';
import { useAssessmentStore } from '@/lib/store';
import { getAllClients, getRecentClients } from '@/lib/clientUtils';
import { Client } from '@/lib/types';
import ClientForm from '@/components/ClientForm';
import { Framework } from '@/lib/types';

export default function NewAssessmentPage() {
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [selectedMode, setSelectedMode] = useState<'quick' | 'detailed'>('quick');
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [creating, setCreating] = useState(false);

  const {
    frameworks,
    loading,
    error,
    loadFrameworks,
    createSession,
  } = useAssessmentStore();

  // Load frameworks and clients on mount
  useEffect(() => {
    loadFrameworks();
    
    // Load clients from API
    const loadClients = async () => {
      try {
        const clientsList = await getAllClients();
        setClients(clientsList);
      } catch (error) {
        console.error('Failed to load clients:', error);
        setClients([]);
      }
    };
    
    loadClients();
  }, [loadFrameworks]);

  const handleCreateAssessment = async () => {
    if (!selectedFramework || !selectedClient) return;

    setCreating(true);
    try {
      const session = await createSession(selectedClient, selectedFramework, selectedMode);
      window.location.href = `/assessment/${session.id}`;
    } catch (error) {
      console.error('Failed to create assessment:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleNewClient = (client: Client) => {
    setClients(getAllClients());
    setSelectedClient(client.id);
    setShowNewClientForm(false);
  };

  const getFrameworkRecommendation = (framework: Framework) => {
    if (!selectedClient) return '';
    
    const client = clients.find(c => c.id === selectedClient);
    if (!client) return '';

    if (framework.id === 'cmmc_l1' && client.contracts.handlesFCI && !client.contracts.handlesCUI) {
      return 'Recommended - FCI handling requires Level 1';
    }
    
    if (framework.id === 'cmmc_l2' && client.contracts.handlesCUI) {
      return 'Required - CUI handling requires Level 2';
    }
    
    if (framework.id === 'cmmc_l1_to_l2' && client.contracts.handlesFCI) {
      return 'Efficient - Delta assessment for existing Level 1';
    }
    
    return '';
  };

  const selectedFrameworkData = frameworks.find(f => f.id === selectedFramework);
  const selectedClientData = clients.find(c => c.id === selectedClient);
  const canCreate = selectedFramework && selectedClient && !creating;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <img 
              src="/CyberOps-Logo-Large.png" 
              alt="Company Logo" 
              className="h-10 w-auto mr-4"
            />
            <div className="border-l border-gray-300 pl-4 mr-3">
              <Shield className="text-gray-700" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">Start New Assessment</h1>
              <p className="text-gray-600">Configure your CMMC compliance assessment</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step 1: Select Client */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                  1
                </div>
                <div>
                  <h2 className="font-semibold text-gray-800">Select Client</h2>
                  <p className="text-sm text-gray-600">Choose or create client</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewClientForm(true)}
                className="flex items-center text-sm text-gray-600 hover:text-gray-800"
              >
                <Plus size={16} className="mr-1" />
                New Client
              </button>
            </div>

            <div className="space-y-3">
              {clients.length === 0 ? (
                <div className="text-center py-8">
                  <User className="mx-auto text-gray-400 mb-3" size={32} />
                  <p className="text-gray-600 text-sm mb-4">No clients yet</p>
                  <button
                    onClick={() => setShowNewClientForm(true)}
                    className="btn-primary text-sm"
                  >
                    Create First Client
                  </button>
                </div>
              ) : (
                clients.map(client => (
                  <div
                    key={client.id}
                    className={`p-3 border-2 rounded-lg cursor-pointer transition-all
                      ${selectedClient === client.id
                        ? 'border-gray-700 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                      }`}
                    onClick={() => setSelectedClient(client.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-800">{client.companyName}</div>
                        <div className="text-sm text-gray-600">{client.contact.primary.name}</div>
                        <div className="text-xs text-gray-500">{client.contact.primary.email}</div>
                      </div>
                      {selectedClient === client.id && (
                        <CheckCircle className="text-green-600" size={20} />
                      )}
                    </div>
                    
                    {client.contracts.handlesCUI && (
                      <div className="mt-2 text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                        CUI Required
                      </div>
                    )}
                    {client.contracts.handlesFCI && !client.contracts.handlesCUI && (
                      <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        FCI Only
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Step 2: Select Framework */}
          <div className="card p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                2
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Select Framework</h2>
                <p className="text-sm text-gray-600">Choose assessment type</p>
              </div>
            </div>

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                <p className="text-gray-600 text-sm">Loading frameworks...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {!loading && !error && (
              <div className="space-y-3">
                {frameworks.map(framework => {
                  const recommendation = getFrameworkRecommendation(framework);
                  const isSelected = selectedFramework === framework.id;
                  
                  return (
                    <div
                      key={framework.id}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all
                        ${isSelected
                          ? 'border-gray-700 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                        }`}
                      onClick={() => setSelectedFramework(framework.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <h3 className="font-medium text-gray-800">{framework.name}</h3>
                            {isSelected && (
                              <CheckCircle className="text-green-600 ml-2" size={16} />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{framework.description}</p>
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{framework.totalControls} controls</span>
                            <span>~{framework.estimatedTime} min</span>
                          </div>
                          
                          {recommendation && (
                            <div className={`mt-2 text-xs px-2 py-1 rounded ${
                              recommendation.includes('Required') 
                                ? 'bg-red-50 text-red-700'
                                : recommendation.includes('Recommended')
                                ? 'bg-green-50 text-green-700'  
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 3: Assessment Mode & Summary */}
          <div className="card p-6">
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                3
              </div>
              <div>
                <h2 className="font-semibold text-gray-800">Assessment Mode</h2>
                <p className="text-sm text-gray-600">Choose depth level</p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedMode === 'quick'
                    ? 'border-gray-700 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setSelectedMode('quick')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Quick Assessment</div>
                    <div className="text-sm text-gray-600">High-level compliance check</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Basic yes/no responses • ~{selectedFrameworkData?.estimatedTime || 30} minutes
                    </div>
                  </div>
                  {selectedMode === 'quick' && (
                    <CheckCircle className="text-green-600" size={20} />
                  )}
                </div>
              </div>

              <div
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all
                  ${selectedMode === 'detailed'
                    ? 'border-gray-700 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
                onClick={() => setSelectedMode('detailed')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">Detailed Assessment</div>
                    <div className="text-sm text-gray-600">Comprehensive assessment</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Notes, confidence tracking & evidence • ~{Math.round((selectedFrameworkData?.estimatedTime || 30) * 2.5)} minutes
                    </div>
                  </div>
                  {selectedMode === 'detailed' && (
                    <CheckCircle className="text-green-600" size={20} />
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            {(selectedClient && selectedFramework) && (
              <div className="border-t pt-6">
                <h3 className="font-medium text-gray-800 mb-3">Assessment Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{selectedClientData?.companyName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Framework:</span>
                    <span className="font-medium">{selectedFrameworkData?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mode:</span>
                    <span className="font-medium capitalize">{selectedMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Est. Time:</span>
                    <span className="font-medium">
                      {selectedMode === 'quick' 
                        ? (selectedFrameworkData?.estimatedTime || 30)
                        : Math.round(((selectedFrameworkData?.estimatedTime || 30) * 2.5))
                      } min
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Create Button */}
            <div className="mt-6">
              <button
                onClick={handleCreateAssessment}
                disabled={!canCreate}
                className={`w-full flex items-center justify-center py-3 rounded-lg font-medium transition-colors
                  ${canCreate
                    ? 'bg-gray-800 text-white hover:bg-gray-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Assessment...
                  </>
                ) : (
                  <>
                    <Clock className="mr-2" size={16} />
                    Start Assessment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Client Modal */}
      {showNewClientForm && (
        <ClientForm
          onSave={handleNewClient}
          onCancel={() => setShowNewClientForm(false)}
          isModal={true}
        />
      )}
    </div>
  );
}