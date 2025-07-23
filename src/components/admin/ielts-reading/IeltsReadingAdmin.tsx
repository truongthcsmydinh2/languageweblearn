import React, { useState } from 'react';
import { Passage, Question, PassageFormData, QuestionFormData } from '@/types/ielts-reading';
import { usePassages } from '@/hooks/ielts-reading/usePassages';
import { useQuestions } from '@/hooks/ielts-reading/useQuestions';
import { PassageList, PassageForm, PassageCard } from './PassageManagement';
import { QuestionList, QuestionForm } from './QuestionManagement';
import JsonImporter from './ImportExport/JsonImporter';
import { Plus, BookOpen, HelpCircle, ArrowLeft, Settings, Upload } from 'lucide-react';

type ViewMode = 'passages' | 'passage-form' | 'passage-detail' | 'question-form' | 'import-json';

const IeltsReadingAdmin: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('passages');
  const [editingPassage, setEditingPassage] = useState<Passage | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  
  const {
    passages,
    selectedPassage,
    loading: passagesLoading,
    error: passagesError,
    fetchPassages,
    createPassage,
    updatePassage,
    deletePassage,
    selectPassage,
    togglePassageStatus,
    duplicatePassage,
  } = usePassages();
  
  const {
    questions,
    loading: questionsLoading,
    error: questionsError,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    selectQuestion,
    reorderQuestions,
    duplicateQuestion,
  } = useQuestions();

  // Passage handlers
  const handleCreatePassage = () => {
    setEditingPassage(null);
    setViewMode('passage-form');
  };

  const handleEditPassage = (passage: Passage) => {
    setEditingPassage(passage);
    setViewMode('passage-form');
  };

  const handlePassageSubmit = async (formData: PassageFormData) => {
    console.log('[IeltsReadingAdmin] Submitting passage:', { isEdit: !!editingPassage, title: formData.title });
    let success = false;
    
    try {
      if (editingPassage) {
        console.log('[IeltsReadingAdmin] Updating passage:', editingPassage.id);
        success = await updatePassage(editingPassage.id, formData);
      } else {
        console.log('[IeltsReadingAdmin] Creating new passage');
        success = await createPassage(formData);
      }
      
      if (success) {
        console.log('[IeltsReadingAdmin] Passage operation successful');
        setViewMode('passages');
        setEditingPassage(null);
      } else {
        console.error('[IeltsReadingAdmin] Passage operation failed');
      }
    } catch (error) {
      console.error('[IeltsReadingAdmin] Passage operation error:', error);
    }
  };

  const handlePassageCancel = () => {
    setViewMode('passages');
    setEditingPassage(null);
  };

  const handleSelectPassage = (passage: Passage) => {
    selectPassage(passage);
    setViewMode('passage-detail');
    fetchQuestions(passage.id);
  };

  const handleDeletePassage = async (id: number) => {
    const success = await deletePassage(id);
    if (success && selectedPassage?.id === id) {
      setViewMode('passages');
    }
  };

  // Question handlers
  const handleCreateQuestion = () => {
    if (!selectedPassage) return;
    setEditingQuestion(null);
    setViewMode('question-form');
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setViewMode('question-form');
  };

  const handleQuestionSubmit = async (formData: QuestionFormData) => {
    if (!selectedPassage) {
      console.warn('[IeltsReadingAdmin] No passage selected for question');
      return;
    }
    
    console.log('[IeltsReadingAdmin] Submitting question:', { isEdit: !!editingQuestion, passageId: selectedPassage.id });
    let success = false;
    
    try {
      if (editingQuestion) {
        console.log('[IeltsReadingAdmin] Updating question:', editingQuestion.id);
        success = await updateQuestion(editingQuestion.id, formData);
      } else {
        console.log('[IeltsReadingAdmin] Creating new question for passage:', selectedPassage.id);
        success = await createQuestion(selectedPassage.id, formData);
      }
      
      if (success) {
        console.log('[IeltsReadingAdmin] Question operation successful');
        setViewMode('passage-detail');
        setEditingQuestion(null);
      } else {
        console.error('[IeltsReadingAdmin] Question operation failed');
      }
    } catch (error) {
      console.error('[IeltsReadingAdmin] Question operation error:', error);
    }
  };

  const handleQuestionCancel = () => {
    setViewMode('passage-detail');
    setEditingQuestion(null);
  };

  // Import handlers
  const handleImportJson = () => {
    console.log('[IeltsReadingAdmin] Opening JSON importer');
    setShowImporter(true);
  };

  const handleImportComplete = async () => {
    console.log('[IeltsReadingAdmin] Import completed, refreshing passages list');
    try {
      // Refresh the passages list to show the newly imported passage
      await fetchPassages();
      setShowImporter(false);
      setViewMode('passages');
      console.log('[IeltsReadingAdmin] Import process completed successfully');
    } catch (error) {
      console.error('[IeltsReadingAdmin] Error refreshing passages after import:', error);
    }
  };

  const handleImportCancel = () => {
    console.log('[IeltsReadingAdmin] Import cancelled');
    setShowImporter(false);
  };

  const handleReorderQuestions = async (reorderedQuestions: Array<{ id: number; order_index: number }>) => {
    if (!selectedPassage) return;
    await reorderQuestions(selectedPassage.id, reorderedQuestions);
  };

  const renderHeader = () => {
    const getTitle = () => {
      switch (viewMode) {
        case 'passages':
          return 'IELTS Reading Passages';
        case 'passage-form':
          return editingPassage ? 'Edit Passage' : 'Create New Passage';
        case 'passage-detail':
          return selectedPassage?.title || 'Passage Details';
        case 'question-form':
          return editingQuestion ? 'Edit Question' : 'Create New Question';
        case 'import-json':
          return 'Import JSON Data';
        default:
          return 'IELTS Reading Admin';
      }
    };

    const showBackButton = viewMode !== 'passages';
    const showCreateButton = viewMode === 'passages';
    const showQuestionButton = viewMode === 'passage-detail';

    return (
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {showBackButton && (
              <button
                onClick={() => {
                  if (viewMode === 'passage-detail') {
                    setViewMode('passages');
                  } else if (viewMode === 'question-form') {
                    setViewMode('passage-detail');
                  } else {
                    setViewMode('passages');
                  }
                }}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">{getTitle()}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {showQuestionButton && (
              <button
                onClick={handleCreateQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <HelpCircle className="h-4 w-4" />
                Add Question
              </button>
            )}
            
            {showCreateButton && (
              <>
                <button
                  onClick={handleImportJson}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Import JSON
                </button>
                <button
                  onClick={handleCreatePassage}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Create Passage
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    // Show errors if any
    if (passagesError || questionsError) {
      return (
        <div className="p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {passagesError || questionsError}
            </div>
          </div>
        </div>
      );
    }

    switch (viewMode) {
      case 'passages':
        return (
          <div className="p-6">
            <PassageList
              passages={passages}
              selectedPassage={selectedPassage}
              onSelect={handleSelectPassage}
              onEdit={handleEditPassage}
              onDelete={handleDeletePassage}
              onDuplicate={duplicatePassage}
              onToggleStatus={togglePassageStatus}
              loading={passagesLoading}
            />
          </div>
        );

      case 'passage-form':
        return (
          <div className="p-6">
            <PassageForm
              passage={editingPassage}
              onSubmit={handlePassageSubmit}
              onCancel={handlePassageCancel}
              loading={passagesLoading}
            />
          </div>
        );

      case 'passage-detail':
        if (!selectedPassage) {
          return (
            <div className="p-6">
              <div className="text-center text-gray-500">
                No passage selected
              </div>
            </div>
          );
        }
        
        return (
          <div className="p-6 space-y-6">
            <PassageCard
              passage={selectedPassage}
              onEdit={handleEditPassage}
              onDelete={handleDeletePassage}
              onDuplicate={duplicatePassage}
              onToggleStatus={togglePassageStatus}
            />
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Questions</h3>
                  <span className="text-sm text-gray-500">
                    {questions.length} question{questions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <QuestionList
                  questions={questions}
                  selectedQuestion={null}
                  onSelect={selectQuestion}
                  onEdit={handleEditQuestion}
                  onDelete={deleteQuestion}
                  onDuplicate={duplicateQuestion}
                  onReorder={handleReorderQuestions}
                  loading={questionsLoading}
                  showReorder={true}
                />
              </div>
            </div>
          </div>
        );

      case 'question-form':
        return (
          <div className="p-6">
            <QuestionForm
              question={editingQuestion}
              onSubmit={handleQuestionSubmit}
              onCancel={handleQuestionCancel}
              loading={questionsLoading}
            />
          </div>
        );

      default:
        return (
          <div className="p-6">
            <div className="text-center text-gray-500">
              Unknown view mode
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      <main className="max-w-7xl mx-auto">
        {renderContent()}
      </main>
      
      {/* JSON Importer Modal */}
      {showImporter && (
        <JsonImporter
          onImport={handleImportComplete}
          onClose={handleImportCancel}
        />
      )}
    </div>
  );
};

export default IeltsReadingAdmin;