'use client';

import { useState, useEffect } from 'react';
import { Shield, User, FileText, Search, Trash2, AlertTriangle, Edit3, Settings } from 'lucide-react';
import { getAllClients, getClientSessions } from '@/lib/clientUtils';
import { Client } from '@/lib/types';

interface SessionInfo {
  id: string;
  frameworkName: string;
  createdAt: string;
  completionPercentage: number;
  status: 'active' | 'completed' | 'draft';
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSessions, setClientSessions] = useState<SessionInfo[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    clientId: string;
    clientName: string;
    sessionCount: number;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientsData = await getAllClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Failed to load clients:', error);
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadClients();
  }, []);

  useEffect(() => {
    const loadClientSessions = async () => {
      if (selectedClient) {
        try {
          const sessions = await getClientSessions(selectedClient.id);
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

  const handleDeleteClient = async (clientId: string) => {
    if (!deleteConfirmation) return;
    
    setDeleting(true);
    try {
      // Delete all client assessments first
      const sessions = await getClientSessions(clientId);
      for (const session of sessions) {
        const response = await fetch(`/api/assessments/${session.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete assessment ${session.id}`);
        }
      }

      // Delete the client
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      // Refresh the client list
      const clientsData = await getAllClients();
      setClients(clientsData);
      setSelectedClient(null);
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('Failed to delete client. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectClientForDeletion = async (client: Client) => {
    try {
      const sessions = await getClientSessions(client.id);
      setDeleteConfirmation({
        clientId: client.id,
        clientName: client.companyName,
        sessionCount: sessions.length
      });
    } catch (error) {
      console.error('Failed to load client sessions:', error);
      setDeleteConfirmation({
        clientId: client.id,
        clientName: client.companyName,
        sessionCount: 0
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="text-gray-700 mr-3" size={32} />
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Client Management</h1>
                <p className="text-gray-600">Manage client data and settings</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <button
                onClick={() => window.location.href = '/'}
                className="btn-secondary flex items-center"
              >
                Back to Dashboard
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
                <h2 className="font-semibold text-gray-800">All Clients</h2>
                <div className="text-sm text-gray-500">
                  {clients.length} client{clients.length !== 1 ? 's' : ''}
                </div>
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
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="text-gray-600 mt-2 text-sm">Loading clients...</p>
                  </div>
                ) : filteredClients.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-gray-600 text-sm">
                      {searchQuery ? 'No clients found' : 'No clients yet'}
                    </p>
                  </div>
                ) : (
                  filteredClients.map(client => (
                    <div
                      key={client.id}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedClient?.id === client.id
                          ? 'border-gray-700 bg-gray-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedClient(client)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
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
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectClientForDeletion(client);
                          }}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                          title="Delete client and all assessments"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Client Details */}
          <div className="lg:col-span-2">
            {selectedClient ? (
              <div className="space-y-6">
                {/* Client Info */}
                <div className="card p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-800">
                      {selectedClient.companyName}
                    </h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">
                        Created: {new Date(selectedClient.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium text-gray-800 mb-3">Contact Information</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Name:</span>
                          <div className="font-medium">{selectedClient.contact.primary.name}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Email:</span>
                          <div className="font-medium">{selectedClient.contact.primary.email}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Phone:</span>
                          <div className="font-medium">{selectedClient.contact.primary.phone}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Title:</span>
                          <div className="font-medium">{selectedClient.contact.primary.title}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-gray-800 mb-3">Contract Details</h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-600">Industry:</span>
                          <div className="font-medium capitalize">{selectedClient.industry}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Company Size:</span>
                          <div className="font-medium capitalize">{selectedClient.companySize}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Contract Types:</span>
                          <div className="mt-1 space-x-2">
                            {selectedClient.contracts.handlesCUI && (
                              <span className="inline-block text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                                CUI
                              </span>
                            )}
                            {selectedClient.contracts.handlesFCI && (
                              <span className="inline-block text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                FCI
                              </span>
                            )}
                            {selectedClient.contracts.hasGovernmentContracts && (
                              <span className="inline-block text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                                Government Contracts
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Associated Assessments */}
                <div className="card p-6">
                  <h3 className="font-semibold text-gray-800 mb-4">Associated Assessments</h3>
                  
                  {clientSessions.length === 0 ? (
                    <div className="text-center py-6">
                      <FileText className="mx-auto text-gray-400 mb-2" size={24} />
                      <p className="text-gray-600 text-sm">No assessments found</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {clientSessions.map(session => (
                        <div key={session.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-800 text-sm">{session.frameworkName}</div>
                              <div className="text-xs text-gray-600">
                                Created: {new Date(session.createdAt).toLocaleDateString()} • 
                                {session.completionPercentage}% complete
                              </div>
                            </div>
                            <div className={`px-2 py-1 text-xs rounded ${
                              session.status === 'completed' ? 'bg-green-100 text-green-700' :
                              session.status === 'active' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {session.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Danger Zone */}
                <div className="card p-6 border-red-200">
                  <h3 className="font-semibold text-red-800 mb-4 flex items-center">
                    <AlertTriangle size={20} className="mr-2" />
                    Danger Zone
                  </h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-red-700 text-sm mb-3">
                      <strong>Delete this client:</strong> This will permanently remove the client and all {clientSessions.length} associated assessment{clientSessions.length !== 1 ? 's' : ''}. This action cannot be undone.
                    </p>
                    <button
                      onClick={() => handleSelectClientForDeletion(selectedClient)}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 flex items-center"
                    >
                      <Trash2 size={14} className="mr-2" />
                      Delete Client
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center">
                <Settings className="mx-auto text-gray-400 mb-4" size={48} />
                <h2 className="text-lg font-semibold text-gray-800 mb-2">Select a Client</h2>
                <p className="text-gray-600">Choose a client from the list to view details and manage settings</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="text-red-600 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">Delete Client</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Are you sure you want to delete <strong>"{deleteConfirmation.clientName}"</strong>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-700 text-sm">
                  <strong>This will permanently delete:</strong>
                </p>
                <ul className="text-red-700 text-sm mt-1 ml-4 list-disc">
                  <li>Client information and contact details</li>
                  <li>{deleteConfirmation.sessionCount} assessment{deleteConfirmation.sessionCount !== 1 ? 's' : ''} and all associated data</li>
                  <li>All generated reports and export history</li>
                </ul>
                <p className="text-red-700 text-sm mt-2 font-medium">
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                disabled={deleting}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteClient(deleteConfirmation.clientId)}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} className="mr-2" />
                    Delete Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}