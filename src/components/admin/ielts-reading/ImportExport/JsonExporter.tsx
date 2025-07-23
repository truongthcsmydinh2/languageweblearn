import React, { useState } from 'react';
import { Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Passage } from '@/types/ielts-reading';
import { transformPassageToJson } from '@/utils/ielts-reading/dataTransformer';
import { formatJsonForDownload } from '@/utils/ielts-reading/jsonUtils';

interface JsonExporterProps {
  passage: Passage;
  onClose: () => void;
}

interface ExportOptions {
  includeGuides: boolean;
  includeMetadata: boolean;
  formatType: 'template' | 'compact' | 'readable';
  filename: string;
}

const JsonExporter: React.FC<JsonExporterProps> = ({ passage, onClose }) => {
  const [options, setOptions] = useState<ExportOptions>({
    includeGuides: true,
    includeMetadata: true,
    formatType: 'template',
    filename: `${passage.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.json`
  });
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  const generatePreview = async () => {
    try {
      const jsonData = await transformPassageToJson(passage, options);
      const formattedJson = formatJsonForDownload(jsonData, options.formatType);
      setPreview(formattedJson);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview generation failed:', error);
      alert('Failed to generate preview');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const jsonData = await transformPassageToJson(passage, options);
      const formattedJson = formatJsonForDownload(jsonData, options.formatType);
      
      // Create and download file
      const blob = new Blob([formattedJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = options.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const getEstimatedFileSize = () => {
    const baseSize = JSON.stringify(passage).length;
    const multiplier = options.includeGuides ? 2.5 : 1.5;
    const sizeKB = Math.round((baseSize * multiplier) / 1024);
    return sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`;
  };

  const getQuestionTypesCount = () => {
    const types = new Set();
    passage.questionGroups?.forEach(group => {
      if (group.type) types.add(group.type);
    });
    return types.size;
  };

  const getTotalQuestions = () => {
    return passage.questionGroups?.reduce((total, group) => {
      return total + (group.questions?.length || 0);
    }, 0) || 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Download className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Export to JSON</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Passage Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">{passage.title}</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Level:</span>
                <span className="ml-2 capitalize">{passage.level}</span>
              </div>
              <div>
                <span className="text-gray-600">Questions:</span>
                <span className="ml-2">{getTotalQuestions()}</span>
              </div>
              <div>
                <span className="text-gray-600">Types:</span>
                <span className="ml-2">{getQuestionTypesCount()}</span>
              </div>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
            
            {/* Filename */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filename
              </label>
              <input
                type="text"
                value={options.filename}
                onChange={(e) => setOptions(prev => ({ ...prev, filename: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter filename"
              />
            </div>

            {/* Format Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="formatType"
                    value="template"
                    checked={options.formatType === 'template'}
                    onChange={(e) => setOptions(prev => ({ ...prev, formatType: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Template Format (Compatible with import)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="formatType"
                    value="compact"
                    checked={options.formatType === 'compact'}
                    onChange={(e) => setOptions(prev => ({ ...prev, formatType: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Compact (Smaller file size)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="formatType"
                    value="readable"
                    checked={options.formatType === 'readable'}
                    onChange={(e) => setOptions(prev => ({ ...prev, formatType: e.target.value as any }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Readable (Pretty formatted)</span>
                </label>
              </div>
            </div>

            {/* Include Options */}
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeGuides}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeGuides: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Include question guides and explanations</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={options.includeMetadata}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Include metadata and timestamps</span>
              </label>
            </div>
          </div>

          {/* File Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium text-blue-800">Export Information</h4>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <p>Estimated file size: {getEstimatedFileSize()}</p>
              <p>Format: JSON ({options.formatType})</p>
              <p>Compatible with: IELTS Reading import system</p>
            </div>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Preview</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg max-h-64 overflow-y-auto">
                <pre className="text-xs whitespace-pre-wrap">
                  {preview.substring(0, 1000)}...
                </pre>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={generatePreview}
              className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Preview
            </button>
            <button
              onClick={handleExport}
              disabled={exporting || !options.filename}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export JSON'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonExporter;