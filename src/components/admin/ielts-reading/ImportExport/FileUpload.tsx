import React, { useCallback, useState } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle, Download, Eye } from 'lucide-react';
import { FileUploadProps } from '@/types/ielts-reading/import.types';

interface FileUploadComponentProps {
  onFileSelect: (file: File | null, error?: string | null) => void;
  onPreview?: (file: File) => void;
  selectedFile?: File | null;
  isProcessing?: boolean;
  error?: string;
  showPreviewButton?: boolean;
}

const FileUpload: React.FC<FileUploadComponentProps> = ({
  onFileSelect,
  onPreview,
  selectedFile,
  isProcessing,
  error,
  showPreviewButton = true
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileContent, setFileContent] = useState<string>('');

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    console.log('[FileUpload] Files dropped:', { fileCount: files.length, fileName: files[0]?.name });
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('[FileUpload] File input change:', { fileCount: files.length, fileName: files[0]?.name });
    handleFiles(files);
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    if (files.length === 0) {
      console.log('[FileUpload] No files to process');
      return;
    }

    const file = files[0];
    console.log('[FileUpload] Processing file:', { fileName: file.name, fileSize: file.size });
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.json')) {
      const errorMsg = 'Vui lòng chọn file JSON (.json)';
      console.error('[FileUpload] Invalid file type:', file.name);
      onFileSelect(null, errorMsg);
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const errorMsg = `File quá lớn (${(file.size / 1024 / 1024).toFixed(2)}MB). Vui lòng chọn file nhỏ hơn 10MB`;
      console.error('[FileUpload] File too large:', { fileName: file.name, size: file.size });
      onFileSelect(null, errorMsg);
      return;
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        setFileContent(content);
        
        // Try to parse JSON to validate
        JSON.parse(content);
        console.log('[FileUpload] File validation passed:', file.name);
        onFileSelect(file, null);
      } catch (parseError) {
        console.error('[FileUpload] JSON parse error:', parseError);
        onFileSelect(null, 'File JSON không hợp lệ. Vui lòng kiểm tra định dạng.');
      }
    };
    
    reader.onerror = () => {
      console.error('[FileUpload] File read error');
      onFileSelect(null, 'Không thể đọc file. Vui lòng thử lại.');
    };
    
    reader.readAsText(file);
  }, [onFileSelect]);

  const handleRemoveFile = useCallback(() => {
    console.log('[FileUpload] Removing file');
    setFileContent('');
    onFileSelect(null);
  }, [onFileSelect]);

  const downloadTemplate = useCallback(() => {
    // Create a sample template
    const template = {
      passage: {
        title: "Sample IELTS Reading Passage",
        content: "This is a sample passage content. Replace this with your actual passage text...",
        level: "intermediate",
        timeLimit: 60,
        wordCount: 300,
        source: "Sample Source",
        tags: ["academic", "general"]
      },
      questionGroups: [
        {
          type: "multiple_choice_single",
          name: "Multiple Choice Questions",
          description: "Choose the best answer",
          instructions: "Choose the letter A, B, C or D.",
          startQuestion: 1,
          endQuestion: 2,
          questions: [
            {
              questionNumber: 1,
              questionText: "What is the main idea of the passage?",
              options: [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
              ],
              answer: "A",
              points: 1,
              difficulty: "medium",
              keywords: ["main idea"],
              relatedParagraph: 1,
              guide: "Look for the topic sentence in the first paragraph."
            }
          ]
        }
      ],
      metadata: {
        version: "1.0",
        description: "Sample IELTS Reading import template",
        createdAt: new Date().toISOString(),
        totalQuestionTypes: 1,
        totalQuestions: 1
      }
    };

    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ielts-reading-template.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (selectedFile) {
    return (
      <div className="space-y-4">
        {/* Selected File Display */}
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <File className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-green-900">{selectedFile.name}</h3>
                <p className="text-sm text-green-700">
                  {formatFileSize(selectedFile.size)} • JSON File
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <button
                onClick={handleRemoveFile}
                className="p-1 text-green-600 hover:text-green-800 transition-colors"
                title="Remove file"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* File Content Preview */}
        {fileContent && (
          <div className="border border-gray-200 rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="font-medium text-gray-900">File Preview</h4>
            </div>
            <div className="p-4">
              <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-40 overflow-y-auto">
                <pre className="whitespace-pre-wrap">
                  {fileContent.substring(0, 500)}...
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Preview Button */}
        {showPreviewButton && onPreview && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => {
                console.log('[FileUpload] Preview button clicked:', selectedFile.name);
                onPreview(selectedFile);
              }}
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              {isProcessing ? 'Đang xử lý...' : 'Xem trước và phân tích'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".json"
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />
        
        <div className="space-y-4">
          <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
            error ? 'bg-red-100' : 'bg-blue-100'
          }`}>
            {error ? (
              <AlertCircle className="h-6 w-6 text-red-600" />
            ) : (
              <Upload className="h-6 w-6 text-blue-600" />
            )}
          </div>
          
          <div>
            <h3 className={`text-lg font-medium ${
              error ? 'text-red-900' : 'text-gray-900'
            }`}>
              {isProcessing ? 'Processing...' : 'Upload JSON File'}
            </h3>
            <p className={`text-sm mt-1 ${
              error ? 'text-red-600' : 'text-gray-600'
            }`}>
              {error || 'Drag and drop your JSON file here, or click to browse'}
            </p>
          </div>
          
          {!error && (
            <div className="text-xs text-gray-500">
              <p>Supported format: JSON</p>
              <p>Maximum file size: 10MB</p>
            </div>
          )}
        </div>
      </div>

      {/* Template Download */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Download className="h-5 w-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-blue-900">Need a template?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Download our JSON template to see the required structure and format for importing IELTS Reading passages.
            </p>
            <button
              onClick={downloadTemplate}
              className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800 underline"
            >
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-red-800 mb-1">Lỗi tải file</h4>
              <div className="text-sm whitespace-pre-line">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Format Guidelines */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">JSON Format Guidelines</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Include passage information (title, content, level, etc.)</li>
          <li>• Define question groups with type and instructions</li>
          <li>• Each question must have questionText, answer, and questionNumber</li>
          <li>• Multiple choice questions require options array</li>
          <li>• Use valid question types (multiple_choice_single, true_false_not_given, etc.)</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;