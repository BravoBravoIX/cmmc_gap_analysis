import React, { useState } from 'react';
import { Download, FileText, Loader } from 'lucide-react';
import { ReportType, ExportFormat } from '@/lib/reportExport';

interface ExportButtonsProps {
  sessionId: string;
  reportType: ReportType;
  className?: string;
}

export default function ExportButtons({ 
  sessionId, 
  reportType, 
  className = '' 
}: ExportButtonsProps) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExport = async (format: ExportFormat) => {
    setExporting(format);
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType,
          format,
          sessionId
        }),
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the filename from the response header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename="')[1]?.split('"')[0]
        : `report.${format}`;

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
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const getReportTitle = (type: ReportType): string => {
    const titles = {
      executive: 'Executive Summary',
      technical: 'Technical Findings',
      homework: 'Homework Assignment',
      progress: 'Progress Report',
      certification: 'Certification Readiness'
    };
    return titles[type];
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => handleExport('pdf')}
        disabled={exporting === 'pdf'}
        className="flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting === 'pdf' ? (
          <Loader className="animate-spin mr-1" size={14} />
        ) : (
          <FileText className="mr-1" size={14} />
        )}
        PDF
      </button>
      
      <button
        onClick={() => handleExport('docx')}
        disabled={exporting === 'docx'}
        className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {exporting === 'docx' ? (
          <Loader className="animate-spin mr-1" size={14} />
        ) : (
          <Download className="mr-1" size={14} />
        )}
        Word
      </button>
    </div>
  );
}