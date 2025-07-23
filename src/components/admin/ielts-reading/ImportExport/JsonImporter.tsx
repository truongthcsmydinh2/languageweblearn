import React, { useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ImportData, ImportPreviewData } from '@/types/ielts-reading/import.types';
import { validateJsonStructure, extractPreviewData, cleanJsonData, generateValidationSummary } from '@/utils/ielts-reading/jsonUtils';
import { transformJsonToPassage } from '@/utils/ielts-reading/dataTransformer';
import FileUpload from './FileUpload';
import ImportPreview from './ImportPreview';

import { useAuth } from '@/contexts/AuthContext';

interface JsonImporterProps {
  onImport: () => Promise<void>;
  onClose: () => void;
}

type ImportStep = 'upload' | 'preview' | 'importing';

const JsonImporter: React.FC<JsonImporterProps> = ({ onImport, onClose }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<ImportData | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null>(null);
  const [previewData, setPreviewData] = useState<ImportPreviewData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  const handleFileSelect = (file: File | null, error?: string | null) => {
    console.log('[JsonImporter] File selected:', { fileName: file?.name, fileSize: file?.size, error });
    
    if (error) {
      console.error('[JsonImporter] File selection error:', error);
      setUploadError(error);
      setSelectedFile(null);
    } else {
      console.log('[JsonImporter] File selected successfully:', file?.name);
      setSelectedFile(file);
      setUploadError('');
    }
    setShowPreview(false);
    setPreviewData(null);
    setValidationResult(null);
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      console.warn('[JsonImporter] No file selected for preview');
      return;
    }

    console.log('[JsonImporter] Starting preview process for file:', selectedFile.name);

    try {
      setIsProcessing(true);
      setUploadError('');

      // Read and parse JSON file
      console.log('[JsonImporter] Reading file content...');
      const fileContent = await selectedFile.text();
      console.log('[JsonImporter] File content length:', fileContent.length);
      
      const jsonData = JSON.parse(fileContent);
      console.log('[JsonImporter] JSON parsed successfully:', Object.keys(jsonData));

      // Clean and validate the JSON data
      console.log('[JsonImporter] Cleaning and validating JSON data...');
      const cleanedData = cleanJsonData(jsonData);
      const validation = validateJsonStructure(cleanedData);
      
      console.log('[JsonImporter] Validation result:', validation);
      
      setJsonData(cleanedData);
      setValidationResult(validation);
      
      if (validation.isValid) {
        // Extract preview data
        console.log('[JsonImporter] Extracting preview data...');
        const preview = extractPreviewData(cleanedData);
        console.log('[JsonImporter] Preview data extracted:', preview);
        setPreviewData(preview);
        setShowPreview(true);
      } else {
        const errorMessage = `File JSON không hợp lệ:\n${validation.errors.join('\n')}`;
        console.error('[JsonImporter] Validation failed:', validation.errors);
        setUploadError(errorMessage);
      }
    } catch (error) {
      console.error('[JsonImporter] Error parsing JSON:', error);
      const errorMessage = error instanceof Error ? 
        `Lỗi đọc file JSON: ${error.message}` : 
        'Không thể đọc file JSON. Vui lòng kiểm tra định dạng file.';
      setUploadError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    console.log('[JsonImporter] ===== HANDLE IMPORT CALLED =====');
    console.log('[JsonImporter] Button clicked, starting import process...');
    
    if (!previewData || !selectedFile) {
      console.warn('[JsonImporter] Missing preview data or file for import');
      console.log('[JsonImporter] previewData:', !!previewData);
      console.log('[JsonImporter] selectedFile:', !!selectedFile);
      return;
    }
    
    console.log('[JsonImporter] Starting import process...');
    console.log('[JsonImporter] User info:', { uid: user?.uid, email: user?.email });
    
    try {
      console.log('[JsonImporter] Setting processing state to true...');
      setIsProcessing(true);
      setCurrentStep('importing');
      console.log('[JsonImporter] State updated, current step: importing');
      
      // Read file content again for import
      console.log('[JsonImporter] Reading file content for import...');
      const fileContent = await selectedFile.text();
      console.log('[JsonImporter] File content read, length:', fileContent.length);
      
      const jsonData = JSON.parse(fileContent);
      console.log('[JsonImporter] JSON parsed, keys:', Object.keys(jsonData));
      
      // Clean data for import
      console.log('[JsonImporter] Cleaning data for import...');
      const cleanedData = cleanJsonData(jsonData);
      console.log('[JsonImporter] Data cleaned, structure:', {
        hasPassage: !!cleanedData.passage,
        hasQuestionGroups: !!cleanedData.questionGroups,
        questionGroupsCount: cleanedData.questionGroups?.length || 0
      });
      
      console.log('[JsonImporter] Preparing API request...');
      
      // Check authentication
      if (!user?.uid) {
        console.error('[JsonImporter] No user UID found');
        throw new Error('Bạn cần đăng nhập để thực hiện thao tác này');
      }
      
      console.log('[JsonImporter] Authentication check passed, user UID:', user.uid);
      
      // Prepare request data
      const requestData = JSON.stringify(cleanedData);
      console.log('[JsonImporter] Request data prepared, size:', requestData.length);
      
      // Call the import API directly
      console.log('[JsonImporter] Making API call to /api/admin/ielts-reading/import...');
      const response = await fetch('/api/admin/ielts-reading/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'firebase_uid': user.uid
        },
        body: requestData
      });
      
      console.log('[JsonImporter] API response received, status:', response.status);
      console.log('[JsonImporter] Response ok:', response.ok);
      
      if (!response.ok) {
        console.error('[JsonImporter] API response not ok, status:', response.status);
        let errorData;
        try {
          errorData = await response.json();
          console.error('[JsonImporter] Error data:', errorData);
        } catch (e) {
          console.error('[JsonImporter] Could not parse error response:', e);
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        throw new Error(errorData.message || 'Import failed');
      }
      
      console.log('[JsonImporter] Parsing successful response...');
      const result = await response.json();
      console.log('[JsonImporter] Import completed successfully:', result);
      
      // Import completed successfully - call onImport to refresh the parent component
      if (result.success && result.passage) {
        console.log('[JsonImporter] Import completed successfully, passage created:', result.passage.title);
        console.log('[JsonImporter] Calling onImport callback to refresh passages list...');
        await onImport();
        console.log('[JsonImporter] onImport callback completed');
      } else {
        console.warn('[JsonImporter] No passage data in result or success=false:', result);
      }
      
      // Reset state after successful import
      console.log('[JsonImporter] Resetting state and closing modal...');
      setSelectedFile(null);
      setPreviewData(null);
      setValidationResult(null);
      setShowPreview(false);
      setCurrentStep('upload');
      onClose();
      console.log('[JsonImporter] Import process completed successfully');
    } catch (error) {
      console.error('[JsonImporter] ===== IMPORT ERROR =====');
      console.error('[JsonImporter] Import failed:', error);
      console.error('[JsonImporter] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      const errorMessage = error instanceof Error ? 
        `Lỗi khi lưu dữ liệu: ${error.message}` : 
        'Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.';
      
      console.log('[JsonImporter] Setting error message:', errorMessage);
      setUploadError(errorMessage);
      setShowPreview(false);
      setCurrentStep('upload');
    } finally {
      console.log('[JsonImporter] Setting processing state to false...');
      setIsProcessing(false);
      console.log('[JsonImporter] ===== HANDLE IMPORT FINISHED =====');
    }
  };

  const handleBack = () => {
    setShowPreview(false);
    setPreviewData(null);
    setValidationResult(null);
  };

  const renderContent = () => {
    return (
      <div className="space-y-6">
        {!showPreview && currentStep !== 'importing' && (
          <FileUpload
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            error={uploadError}
            isProcessing={isProcessing}
            onPreview={handlePreview}
            showPreviewButton={!!selectedFile && !isProcessing}
          />
        )}
        
        {showPreview && previewData && validationResult && (
          <ImportPreview
            previewData={previewData}
            validationResult={validationResult}
            onBack={handleBack}
            onImport={handleImport}
            isProcessing={isProcessing}
          />
        )}
        
        {currentStep === 'importing' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Đang lưu dữ liệu...</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">JSON Import</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default JsonImporter;