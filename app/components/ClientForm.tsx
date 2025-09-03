'use client';

import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from 'react';
import { X, AlertCircle, CheckCircle, Building, User, Mail, Phone, MapPin, Upload, Image as ImageIcon } from 'lucide-react';
import { Client } from '@/lib/types';
import { createClient, updateClient, validateClient } from '@/lib/clientUtils';

interface ClientFormProps {
  client?: Client;
  onSave: (client: Client) => void;
  onCancel: () => void;
  isModal?: boolean;
}

const industries = [
  'Aerospace & Defense', 'Manufacturing', 'Information Technology', 'Healthcare',
  'Financial Services', 'Government', 'Energy & Utilities', 'Transportation',
  'Education', 'Professional Services', 'Other'
];

const contractTypes = [
  'Prime Contractor', 'Subcontractor', 'GSA Schedule', 'SEWP', 'CIO-SP3', 'Other'
];

const agencies = [
  'Department of Defense', 'Department of Homeland Security', 'Department of Energy',
  'Department of Health and Human Services', 'Department of Justice', 'NASA',
  'Department of Transportation', 'Department of Commerce', 'Other'
];

// Isolated text input that doesn't cause parent re-renders
const IsolatedTextInput = memo(({ 
  id, 
  label, 
  initialValue, 
  onChange, 
  placeholder = '', 
  required = false,
  type = 'text'
}: {
  id: string;
  label: string;
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) => {
  const [value, setValue] = useState(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  // Update local state when initial value changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);
  
  const handleChange = (newValue: string) => {
    setValue(newValue);
    
    // Debounce the parent update to prevent constant re-renders
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, 300);
  };
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
      />
    </div>
  );
});

const MemoizedTextInput = memo(({ 
  id, 
  label, 
  value, 
  onChange, 
  placeholder = '', 
  required = false,
  type = 'text'
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
    />
  </div>
));

const MemoizedSelectInput = memo(({
  id,
  label,
  value,
  onChange,
  options,
  placeholder = '',
  required = false
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  required?: boolean;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
    >
      <option value="">{placeholder}</option>
      {options.map(option => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  </div>
));

const MemoizedNumberInput = memo(({
  id,
  label,
  value,
  onChange,
  placeholder = '',
  required = false
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
}) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type="number"
      id={id}
      value={value || ''}
      onChange={(e) => onChange(parseInt(e.target.value) || 0)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
    />
  </div>
));

export default function ClientForm({ client, onSave, onCancel, isModal = true }: ClientFormProps) {
  const [formData, setFormData] = useState<Partial<Client>>(client || {
    companyName: '',
    industry: '',
    size: { employees: 0, revenue: '', locations: 1 },
    contact: {
      primary: { name: '', title: '', email: '', phone: '' }
    },
    address: { street1: '', city: '', state: '', zip: '', country: 'USA' },
    contracts: {
      hasFederalContracts: false,
      contractTypes: [],
      primeOrSub: '',
      agencies: [],
      handlesCUI: false,
      handlesFCI: false,
    },
    logo: ''
  });

  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[]; }>({ valid: true, errors: [], warnings: [] });
  const [showValidation, setShowValidation] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(client?.logo || '');
  const [saving, setSaving] = useState(false);

  const validateForm = () => {
    const result = validateClient(formData);
    setValidation(result);
    return result.valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      let savedClient: Client;
      
      if (client?.id) {
        savedClient = await updateClient(client.id, formData);
      } else {
        savedClient = await createClient(formData);
      }
      
      onSave(savedClient);
    } catch (error) {
      console.error('Failed to save client:', error);
      alert('Failed to save client. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateFormData = useCallback((path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const result = { ...prev };
      let current: any = result;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        } else {
          current[keys[i]] = { ...current[keys[i]] };
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return result;
    });
  }, []);

  const handleContractTypeChange = useCallback((type: string, checked: boolean) => {
    const current = formData.contracts?.contractTypes || [];
    const updated = checked 
      ? [...current, type]
      : current.filter(t => t !== type);
    updateFormData('contracts.contractTypes', updated);
  }, [formData.contracts?.contractTypes, updateFormData]);

  const handleAgencyChange = useCallback((agency: string, checked: boolean) => {
    const current = formData.contracts?.agencies || [];
    const updated = checked 
      ? [...current, agency]
      : current.filter(a => a !== agency);
    updateFormData('contracts.agencies', updated);
  }, [formData.contracts?.agencies, updateFormData]);

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert('Image file must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setLogoPreview(result);
      updateFormData('logo', result);
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview('');
    updateFormData('logo', '');
  };

  // Stable change handlers using useCallback
  const handleCompanyNameChange = useCallback((value: string) => {
    updateFormData('companyName', value);
  }, [updateFormData]);

  const handleIndustryChange = useCallback((value: string) => {
    updateFormData('industry', value);
  }, [updateFormData]);

  const handleEmployeesChange = useCallback((value: number) => {
    updateFormData('size.employees', value);
  }, [updateFormData]);

  const handleRevenueChange = useCallback((value: string) => {
    updateFormData('size.revenue', value);
  }, [updateFormData]);

  const handleLocationsChange = useCallback((value: number) => {
    updateFormData('size.locations', value);
  }, [updateFormData]);

  const handlePrimaryNameChange = useCallback((value: string) => {
    updateFormData('contact.primary.name', value);
  }, [updateFormData]);

  const handlePrimaryTitleChange = useCallback((value: string) => {
    updateFormData('contact.primary.title', value);
  }, [updateFormData]);

  const handlePrimaryEmailChange = useCallback((value: string) => {
    updateFormData('contact.primary.email', value);
  }, [updateFormData]);

  const handlePrimaryPhoneChange = useCallback((value: string) => {
    updateFormData('contact.primary.phone', value);
  }, [updateFormData]);

  const handleStreet1Change = useCallback((value: string) => {
    updateFormData('address.street1', value);
  }, [updateFormData]);

  const handleStreet2Change = useCallback((value: string) => {
    updateFormData('address.street2', value);
  }, [updateFormData]);

  const handleCityChange = useCallback((value: string) => {
    updateFormData('address.city', value);
  }, [updateFormData]);

  const handleStateChange = useCallback((value: string) => {
    updateFormData('address.state', value);
  }, [updateFormData]);

  const handleZipChange = useCallback((value: string) => {
    updateFormData('address.zip', value);
  }, [updateFormData]);

  const handleDbaChange = useCallback((value: string) => {
    updateFormData('dba', value);
  }, [updateFormData]);

  const FormContent = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Validation Messages */}
      {showValidation && !validation.valid && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="text-red-500 mr-2" size={20} />
            <span className="font-medium text-red-800">Please fix the following errors:</span>
          </div>
          <ul className="text-sm text-red-700 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {showValidation && validation.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="text-yellow-600 mr-2" size={20} />
            <span className="font-medium text-yellow-800">Recommendations:</span>
          </div>
          <ul className="text-sm text-yellow-700 space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Company Information */}
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <Building className="text-gray-600 mr-2" size={20} />
          <h3 className="text-lg font-medium text-gray-800">Company Information</h3>
        </div>

        {/* Logo Upload */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Logo
          </label>
          <div className="flex items-center space-x-4">
            {logoPreview ? (
              <div className="relative">
                <img
                  src={logoPreview}
                  alt="Company logo preview"
                  className="w-20 h-20 object-contain border border-gray-300 rounded-lg bg-white p-2"
                />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                <ImageIcon className="text-gray-400" size={24} />
              </div>
            )}
            
            <div>
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <label
                htmlFor="logo-upload"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                <Upload size={16} className="mr-2" />
                Choose Image
              </label>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG up to 2MB
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IsolatedTextInput
            id="companyName"
            label="Company Name"
            initialValue={formData.companyName || ''}
            onChange={handleCompanyNameChange}
            placeholder="ACME Corporation"
            required={true}
          />

          <IsolatedTextInput
            id="dba"
            label="DBA (if different)"
            initialValue={formData.dba || ''}
            onChange={handleDbaChange}
            placeholder="Doing Business As"
          />

          <MemoizedSelectInput
            id="industry"
            label="Industry"
            value={formData.industry || ''}
            onChange={handleIndustryChange}
            options={industries}
            placeholder="Select Industry"
          />

          <MemoizedNumberInput
            id="employees"
            label="Number of Employees"
            value={formData.size?.employees || 0}
            onChange={handleEmployeesChange}
            placeholder="50"
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <User className="text-gray-600 mr-2" size={20} />
          <h3 className="text-lg font-medium text-gray-800">Primary Contact</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IsolatedTextInput
            id="contactName"
            label="Contact Name"
            initialValue={formData.contact?.primary?.name || ''}
            onChange={handlePrimaryNameChange}
            placeholder="John Smith"
            required={true}
          />

          <IsolatedTextInput
            id="contactTitle"
            label="Title"
            initialValue={formData.contact?.primary?.title || ''}
            onChange={handlePrimaryTitleChange}
            placeholder="Chief Information Officer"
          />

          <IsolatedTextInput
            id="contactEmail"
            label="Email"
            initialValue={formData.contact?.primary?.email || ''}
            onChange={handlePrimaryEmailChange}
            placeholder="john.smith@acme.com"
            type="email"
            required={true}
          />

          <IsolatedTextInput
            id="contactPhone"
            label="Phone"
            initialValue={formData.contact?.primary?.phone || ''}
            onChange={handlePrimaryPhoneChange}
            placeholder="(555) 123-4567"
            type="tel"
          />
        </div>
      </div>

      {/* Address */}
      <div className="space-y-4">
        <div className="flex items-center mb-4">
          <MapPin className="text-gray-600 mr-2" size={20} />
          <h3 className="text-lg font-medium text-gray-800">Business Address</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={formData.address?.street1 || ''}
              onChange={(e) => updateFormData('address.street1', e.target.value)}
              className="input"
              placeholder="123 Business Ave"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                value={formData.address?.city || ''}
                onChange={(e) => updateFormData('address.city', e.target.value)}
                className="input"
                placeholder="Anytown"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <input
                type="text"
                value={formData.address?.state || ''}
                onChange={(e) => updateFormData('address.state', e.target.value)}
                className="input"
                placeholder="CA"
                maxLength={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                value={formData.address?.zip || ''}
                onChange={(e) => updateFormData('address.zip', e.target.value)}
                className="input"
                placeholder="12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country
              </label>
              <input
                type="text"
                value={formData.address?.country || 'USA'}
                onChange={(e) => updateFormData('address.country', e.target.value)}
                className="input"
                placeholder="USA"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contract Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-800">Contract Information</h3>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasFederalContracts"
              checked={formData.contracts?.hasFederalContracts || false}
              onChange={(e) => updateFormData('contracts.hasFederalContracts', e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasFederalContracts" className="text-sm font-medium text-gray-700">
              Has federal contracts or subcontracts
            </label>
          </div>

          {formData.contracts?.hasFederalContracts && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Types (select all that apply)
                </label>
                <div className="space-y-2">
                  {contractTypes.map(type => (
                    <div key={type} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`contract-${type}`}
                        checked={formData.contracts?.contractTypes?.includes(type) || false}
                        onChange={(e) => handleContractTypeChange(type, e.target.checked)}
                        className="mr-2"
                      />
                      <label htmlFor={`contract-${type}`} className="text-sm text-gray-700">
                        {type}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="handlesFCI"
                    checked={formData.contracts?.handlesFCI || false}
                    onChange={(e) => updateFormData('contracts.handlesFCI', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="handlesFCI" className="text-sm font-medium text-gray-700">
                    Handles Federal Contract Information (FCI)
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="handlesCUI"
                    checked={formData.contracts?.handlesCUI || false}
                    onChange={(e) => updateFormData('contracts.handlesCUI', e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="handlesCUI" className="text-sm font-medium text-gray-700">
                    Handles Controlled Unclassified Information (CUI)
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          type="button"
          onClick={() => {
            if (validateForm()) {
              onCancel();
            }
          }}
          className="btn-secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary"
        >
          {saving ? 'Saving...' : client ? 'Update Client' : 'Create Client'}
        </button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">
              {client ? 'Edit Client' : 'New Client'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          <div className="px-6 py-4">
            <FormContent />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <FormContent />
    </div>
  );
}