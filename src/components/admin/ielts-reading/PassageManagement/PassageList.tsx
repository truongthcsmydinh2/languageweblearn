import React, { useMemo } from 'react';
import { Passage, PassageListProps } from '@/types/ielts-reading';
import { formatDate, truncateText, getLevelClass } from '@/utils/ielts-reading/helpers';
import { Eye, Edit, Copy, Trash2, ToggleLeft, ToggleRight, ChevronRight, ChevronDown, Book, FileText } from 'lucide-react';

// Helper function to extract Cambridge IELTS info from title
const extractCamTestInfo = (title: string) => {
  console.log('[PassageList] Extracting cam test info from title:', title);
  
  // Try to match patterns like "Cam 19 Test 1 Reading Passage 1: Title"
  const fullMatch = title.match(/^(Cam \d+)\s+(Test \d+)\s+(Reading Passage \d+):\s*(.+)$/);
  if (fullMatch) {
    const result = {
      cambridge: fullMatch[1],
      test: fullMatch[2], 
      passage: fullMatch[3],
      title: fullMatch[4],
      hasStructure: true
    };
    console.log('[PassageList] Full match found:', result);
    return result;
  }
  
  // Try to match patterns like "Cam 19 Test 1: Title"
  const simpleMatch = title.match(/^(Cam \d+)\s+(Test \d+):\s*(.+)$/);
  if (simpleMatch) {
    const result = {
      cambridge: simpleMatch[1],
      test: simpleMatch[2],
      passage: '',
      title: simpleMatch[3],
      hasStructure: true
    };
    console.log('[PassageList] Simple match found:', result);
    return result;
  }
  
  // No structure found, return original title
  const result = {
    cambridge: '',
    test: '',
    passage: '',
    title: title,
    hasStructure: false
  };
  console.log('[PassageList] No structure found:', result);
  return result;
};

interface GroupedPassage extends Passage {
  camInfo: ReturnType<typeof extractCamTestInfo>;
}

interface PassageGroup {
  cambridge: string;
  tests: {
    [testName: string]: GroupedPassage[];
  };
}

const PassageList: React.FC<PassageListProps> = ({
  passages,
  selectedPassage,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  loading = false,
}) => {
  const [expandedCambridge, setExpandedCambridge] = React.useState<Set<string>>(new Set());
  const [expandedTests, setExpandedTests] = React.useState<Set<string>>(new Set());
  
  // Group passages by Cambridge IELTS and Test
  const groupedPassages = useMemo(() => {
    const groups: { [cambridge: string]: PassageGroup } = {};
    const ungrouped: GroupedPassage[] = [];
    
    passages.forEach(passage => {
      const camInfo = extractCamTestInfo(passage.title);
      const groupedPassage: GroupedPassage = { ...passage, camInfo };
      
      if (camInfo.hasStructure && camInfo.cambridge && camInfo.test) {
        if (!groups[camInfo.cambridge]) {
          groups[camInfo.cambridge] = {
            cambridge: camInfo.cambridge,
            tests: {}
          };
        }
        
        if (!groups[camInfo.cambridge].tests[camInfo.test]) {
          groups[camInfo.cambridge].tests[camInfo.test] = [];
        }
        
        groups[camInfo.cambridge].tests[camInfo.test].push(groupedPassage);
      } else {
        ungrouped.push(groupedPassage);
      }
    });
    
    return { groups, ungrouped };
  }, [passages]);
  
  const toggleCambridge = (cambridge: string) => {
    setExpandedCambridge(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cambridge)) {
        newSet.delete(cambridge);
      } else {
        newSet.add(cambridge);
      }
      return newSet;
    });
  };
  
  const toggleTest = (testKey: string) => {
    setExpandedTests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(testKey)) {
        newSet.delete(testKey);
      } else {
        newSet.add(testKey);
      }
      return newSet;
    });
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading passages...</span>
      </div>
    );
  }

  if (passages.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <Eye className="mx-auto h-12 w-12 mb-2" />
          <p className="text-lg font-medium">No passages found</p>
          <p className="text-sm">Create your first IELTS Reading passage to get started.</p>
        </div>
      </div>
    );
  }

  const renderPassageCard = (passage: GroupedPassage, isNested = false) => (
    <div
      key={passage.id}
      className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
        selectedPassage?.id === passage.id
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:border-gray-300'
      } ${isNested ? 'ml-6' : ''}`}
      onClick={() => onSelect(passage)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {/* Display hierarchical title */}
            {passage.camInfo.hasStructure ? (
              <div className="flex items-center gap-2">
                {passage.camInfo.passage && (
                  <span className="text-sm font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {passage.camInfo.passage}
                  </span>
                )}
                <h3 className="text-lg font-semibold text-gray-900">
                  {passage.camInfo.title}
                </h3>
              </div>
            ) : (
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {passage.title}
              </h3>
            )}
            
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                getLevelClass(passage.level)
              }`}
            >
              {passage.level}
            </span>
            <div className="flex items-center">
              {passage.is_active ? (
                <ToggleRight className="h-4 w-4 text-green-500" />
              ) : (
                <ToggleLeft className="h-4 w-4 text-gray-400" />
              )}
              <span className={`ml-1 text-xs ${
                passage.is_active ? 'text-green-600' : 'text-gray-500'
              }`}>
                {passage.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm mb-3">
            {truncateText(passage.content, 150)}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span>Genre: {passage.genre || 'General'}</span>
            <span>Time: {passage.time_limit || 20} min</span>
            <span>Questions: {passage.question_count || 0}</span>
            <span>Created: {passage.created_at ? formatDate(passage.created_at) : 'N/A'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(passage);
            }}
            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit passage"
          >
            <Edit className="h-4 w-4" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(passage.id);
            }}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Duplicate passage"
          >
            <Copy className="h-4 w-4" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleStatus(passage.id, !passage.is_active);
            }}
            className={`p-2 rounded-lg transition-colors ${
              passage.is_active
                ? 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
                : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
            }`}
            title={passage.is_active ? 'Deactivate passage' : 'Activate passage'}
          >
            {passage.is_active ? (
              <ToggleLeft className="h-4 w-4" />
            ) : (
              <ToggleRight className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this passage? This action cannot be undone.')) {
                onDelete(passage.id);
              }
            }}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete passage"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Grouped passages by Cambridge IELTS */}
      {Object.entries(groupedPassages.groups).map(([cambridge, group]) => (
        <div key={cambridge} className="border border-gray-300 rounded-lg overflow-hidden">
          {/* Cambridge IELTS Header */}
          <div 
            className="bg-gray-50 border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => toggleCambridge(cambridge)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Book className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">{cambridge}</h2>
                <span className="text-sm text-gray-500">
                  ({Object.values(group.tests).reduce((acc, tests) => acc + tests.length, 0)} passages)
                </span>
              </div>
              {expandedCambridge.has(cambridge) ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </div>
          </div>
          
          {/* Tests under Cambridge IELTS */}
          {expandedCambridge.has(cambridge) && (
            <div className="bg-white">
              {Object.entries(group.tests).map(([testName, testPassages]) => {
                const testKey = `${cambridge}-${testName}`;
                return (
                  <div key={testKey} className="border-b border-gray-100 last:border-b-0">
                    {/* Test Header */}
                    <div 
                      className="bg-gray-25 p-3 cursor-pointer hover:bg-gray-50 transition-colors ml-4"
                      onClick={() => toggleTest(testKey)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <h3 className="font-medium text-gray-800">{testName}</h3>
                          <span className="text-sm text-gray-500">({testPassages.length} passages)</span>
                        </div>
                        {expandedTests.has(testKey) ? (
                          <ChevronDown className="h-4 w-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                    
                    {/* Passages under Test */}
                    {expandedTests.has(testKey) && (
                      <div className="p-4 space-y-3">
                        {testPassages.map(passage => renderPassageCard(passage, true))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
      
      {/* Ungrouped passages */}
      {groupedPassages.ungrouped.length > 0 && (
        <div className="space-y-4">
          {groupedPassages.ungrouped.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Other Passages
              </h3>
            </div>
          )}
          {groupedPassages.ungrouped.map(passage => renderPassageCard(passage))}
        </div>
      )}
    </div>
  );
};

export default PassageList;