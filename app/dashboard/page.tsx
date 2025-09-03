'use client';

import { useState, useEffect } from 'react';
import { Shield, User, FileText, Clock, Package, Download, Plus, Search } from 'lucide-react';
import { getAllClients, getRecentClients, getClientSessions } from '@/lib/clientUtils';
import { Client } from '@/lib/types';
import ClientForm from '@/components/ClientForm';

interface SessionInfo {
  id: string;
  frameworkName: string;
  createdAt: string;
  completionPercentage: number;
  status: 'active' | 'completed' | 'draft';
}

export default function DashboardPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientSessions, setClientSessions] = useState<SessionInfo[]>([]);
  const [bulkExporting, setBulkExporting] = useState(false);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getAllClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Failed to load clients:', error);
        // Set empty array on error to prevent crashes
        setClients([]);
      }
    };
    
    loadClients();
  }, []);

  useEffect(() => {
    const loadClientSessions = async () => {
      if (selectedClient) {
        try {
          const sessions = await getClientSessions(selectedClient);
          setClientSessions(sessions);
        } catch (error) {
          console.error('Failed to load client sessions:', error);
          setClientSessions([]);
        }
      }
    };
    
    loadClientSessions();
  }, [selectedClient]);

  const filteredClients = clients.filter(client =>
    client.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.contact.primary.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewClient = async (client: Client) => {
    try {
      const clientsData = await getAllClients();
      setClients(clientsData);
      setShowNewClientForm(false);
    } catch (error) {
      console.error('Failed to refresh client list:', error);
      setShowNewClientForm(false);
    }
  };

  const calculateCompletionPercentage = (responses: Record<string, any>): number => {
    const totalResponses = Object.keys(responses).length;
    if (totalResponses === 0) return 0;
    
    const completedResponses = Object.values(responses).filter(
      response => response && response.answer && response.answer !== 'unsure'
    ).length;
    
    return Math.round((completedResponses / totalResponses) * 100);
  };

  const handleBulkExportClient = async (clientId: string, format: 'pdf' | 'docx') => {
    setBulkExporting(true);
    
    try {
      const sessions = await getClientSessions(clientId);
      
      if (sessions.length === 0) {
        alert('No completed assessments found for this client');
        setBulkExporting(false);
        return;
      }

      // For now, export the most recent completed session
      const completedSession = sessions.find(s => s.status === 'completed') || sessions[0];
      
      // Get session data from API instead of localStorage
      const sessionResponse = await fetch(`/api/assessments/${completedSession.id}`);
      if (!sessionResponse.ok) {
        throw new Error('Failed to load session data');
      }
      const sessionData = await sessionResponse.json();

      const response = await fetch('/api/export/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format,
          sessionId: completedSession.id,
          sessionData,
          reportTypes: ['executive', 'technical', 'homework', 'progress', 'certification']
        }),
      });

      if (!response.ok) {
        throw new Error('Bulk export failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const client = clients.find(c => c.id === clientId);
      const timestamp = new Date().toISOString().split('T')[0];
      a.download = `${client?.companyName || 'Client'}_CMMC_Reports_${timestamp}.zip`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setBulkExporting(false);

    } catch (error) {
      console.error('Bulk export failed:', error);
      alert('Bulk export failed. Please try again.');
      setBulkExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="text-gray-700 mr-3" size={32} />
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Client Dashboard</h1>
                <p className="text-gray-600">Manage clients and assessments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <button
                onClick={() => window.location.href = '/assessment/new'}
                className="btn-primary flex items-center"
              >
                <Plus size={16} className="mr-2" />
                New Assessment
              </button>
              
              <div className="flex items-center">
                <div className="text-right mr-3">
                  <div className="text-xs text-gray-500">POWERED BY</div>
                  <div className="text-sm font-bold text-gray-700">CyberOps</div>
                </div>
                <img 
                  src="/CyberOps-Logo-Large.png" 
                  alt="CyberOps Logo" 
                  className="h-12 w-auto object-contain"
                  style={{ maxHeight: '48px', width: 'auto' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Client List */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-semibold text-gray-800">Clients</h2>
                <button
                  onClick={() => setShowNewClientForm(true)}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <Plus size={16} className="mr-1" />
                  Add Client
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                />
              </div>

              {/* Client List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-gray-600 text-sm mb-4">
                      {searchQuery ? 'No clients found' : 'No clients yet'}
                    </p>
                    {!searchQuery && (
                      <button
                        onClick={() => setShowNewClientForm(true)}
                        className="btn-primary text-sm"
                      >
                        Create First Client
                      </button>
                    )}
                  </div>
                ) : (
                  filteredClients.map(client => (
                    <div
                      key={client.id}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedClient === client.id
                          ? 'border-gray-700 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedClient(client.id)}
                    >
                      <div className="font-medium text-gray-800">{client.companyName}</div>
                      <div className="text-sm text-gray-600">{client.contact.primary.name}</div>
                      <div className="text-xs text-gray-500">{client.contact.primary.email}</div>
                      
                      <div className="flex items-center mt-2 space-x-2">
                        {client.contracts.handlesCUI && (
                          <span className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                            CUI Required
                          </span>
                        )}
                        {client.contracts.handlesFCI && !client.contracts.handlesCUI && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            FCI Only
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Client Details & Sessions */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="space-y-6">
                {/* Client Info */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold text-gray-800">
                      {clients.find(c => c.id === selectedClient)?.companyName}
                    </h2>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleBulkExportClient(selectedClient, 'pdf')}
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
                            Export All PDF
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleBulkExportClient(selectedClient, 'docx')}
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
                            Export All Word
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Contact:</span>
                      <div className="mt-1">
                        <div className="font-medium">
                          {clients.find(c => c.id === selectedClient)?.contact.primary.name}
                        </div>
                        <div className="text-gray-600">
                          {clients.find(c => c.id === selectedClient)?.contact.primary.email}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Contract Type:</span>
                      <div className="mt-1 space-x-2">
                        {clients.find(c => c.id === selectedClient)?.contracts.handlesCUI && (
                          <span className="inline-block text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                            CUI
                          </span>
                        )}
                        {clients.find(c => c.id === selectedClient)?.contracts.handlesFCI && (
                          <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                            FCI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assessments */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="font-semibold text-gray-800">Assessments</h2>
                    <button
                      onClick={() => window.location.href = `/assessment/new?client=${selectedClient}`}
                      className="btn-primary flex items-center text-sm"
                    >
                      <Plus size={16} className="mr-2" />
                      New Assessment
                    </button>
                  </div>

                  {clientSessions.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="mx-auto text-gray-400 mb-3" size={32} />
                      <p className="text-gray-600 text-sm mb-4">No assessments yet</p>
                      <button
                        onClick={() => window.location.href = `/assessment/new?client=${selectedClient}`}
                        className="btn-primary text-sm"
                      >
                        Start First Assessment
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {clientSessions.map(session => (
                        <div key={session.id} className="border rounded-lg p-4 hover:shadow-sm transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="font-medium text-gray-800">{session.frameworkName}</div>
                              <div className="text-sm text-gray-600">
                                Created: {new Date(session.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className={`px-2 py-1 text-xs rounded ${
                                session.status === 'completed' ? 'bg-green-100 text-green-700' :
                                session.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {session.status}
                              </div>
                              
                              <div className="text-sm text-gray-600">
                                {session.completionPercentage}% complete
                              </div>
                              
                              <div className="flex space-x-2">
                                {session.status === 'completed' && (
                                  <button
                                    onClick={() => window.location.href = `/reports/${session.id}`}
                                    className="text-sm text-blue-600 hover:text-blue-800"
                                  >
                                    View Report
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => window.location.href = `/assessment/${session.id}`}
                                  className="text-sm text-gray-600 hover:text-gray-800"
                                >
                                  {session.status === 'completed' ? 'Review' : 'Continue'}
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gray-700 h-2 rounded-full"
                              style={{ width: `${session.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <User className="mx-auto text-gray-400 mb-4" size={48} />
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Select a Client</h2>
                <p className="text-gray-600">Choose a client from the list to view their assessments and reports</p>
              </div>
            )}
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