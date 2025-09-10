import React, { useState, useEffect, useMemo } from 'react';

// --- BigQuery Service (Updated) ---
const bigQueryService = {
  getAnalysisTypes: async () => {
    try {
      const response = await fetch('/api/query?queryName=getAnalysisTypes');
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch analysis types:", error);
      return [];
    }
  },
  getFiltersForType: async (analysisType) => {
    try {
      const response = await fetch(`/api/query?queryName=getFiltersForType&analysisType=${analysisType}`);
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
       console.error(`Failed to fetch filters for ${analysisType}:`, error);
       return [];
    }
  },
  getPropertyValues: async (propertyId) => {
    try {
      const response = await fetch(`/api/query?queryName=getPropertyValues&propertyId=${propertyId}`);
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
       console.error(`Failed to fetch values for ${propertyId}:`, error);
       return [];
    }
  }
};


// --- New & Refactored React Components ---

const FilterValueInput = ({ activeFilter, onUpdate }) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Start in loading state

  useEffect(() => {
    // Always try to fetch a list of values for the given property.
    const fetchOptions = async () => {
      setIsLoading(true);
      const fetchedOptions = await bigQueryService.getPropertyValues(activeFilter.property_id);
      setOptions(fetchedOptions || []); // Ensure options is always an array
      setIsLoading(false);
    };
    fetchOptions();
  }, [activeFilter.property_id]); // Re-run whenever the property ID changes

  if (isLoading) {
    return <select className="p-1 border border-gray-300 rounded-md text-sm flex-grow bg-gray-100" disabled><option>Loading values...</option></select>;
  }

  // If the API returned a list of options, render a dropdown.
  if (options.length > 0) {
    return (
      <select
        className="p-1 border border-gray-300 rounded-md text-sm flex-grow"
        value={activeFilter.value}
        onChange={(e) => onUpdate(activeFilter.id, { ...activeFilter, value: e.target.value })}
      >
        <option value="">Select a value</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    );
  }
  
  // Otherwise, if no options were found, fall back to a text input.
  return (
    <input
      type="text"
      className="p-1 border border-gray-300 rounded-md text-sm flex-grow"
      value={activeFilter.value}
      onChange={(e) => onUpdate(activeFilter.id, { ...activeFilter, value: e.target.value })}
      placeholder="Enter value..."
    />
  );
};


// Component for a single, configured filter in the main panel
const ActiveFilterRow = ({ activeFilter, onRemove, onUpdate }) => {
  // Use the operators from the filter definition instead of a mock list
  const operators = activeFilter.available_operators || ['is equal to']; // Fallback for safety

  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in">
      <span className="font-medium text-gray-700">{activeFilter.property_label}</span>
      <select 
        className="p-1 border border-gray-300 rounded-md text-sm"
        value={activeFilter.operator}
        onChange={(e) => onUpdate(activeFilter.id, { ...activeFilter, operator: e.target.value })}
      >
        {operators.map(op => <option key={op} value={op}>{op}</option>)}
      </select>
      
      <FilterValueInput activeFilter={activeFilter} onUpdate={onUpdate} />

      <button onClick={() => onRemove(activeFilter.id)} className="text-gray-400 hover:text-red-600 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

// Component for the slide-out panel to select new filters
const FilterSelectorPanel = ({ availableFilters, onAddFilter, onClose, isOpen }) => {
    const groupedFilters = useMemo(() => {
        // Group available filters by their scope label
        return availableFilters.reduce((acc, filter) => {
            const scope = filter.property_scope_label || 'General'; // Use a fallback scope
            if (!acc[scope]) acc[scope] = [];
            acc[scope].push(filter);
            return acc;
        }, {});
    }, [availableFilters]);

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>
      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b">
                <h2 className="text-xl font-semibold text-gray-800">Add filter</h2>
                <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </header>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {Object.keys(groupedFilters).length > 0 ? (
                    Object.entries(groupedFilters).map(([scope, filters]) => (
                        <div key={scope}>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">{scope}</h3>
                            <ul className="space-y-1">
                                {filters.map(filter => (
                                    <li 
                                        key={filter.property_id} 
                                        className="p-2 text-gray-700 rounded-md cursor-pointer hover:bg-blue-100"
                                        onClick={() => onAddFilter(filter)}
                                    >
                                        {filter.property_label}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 text-center p-4">No available filters for this analysis type.</p>
                )}
            </div>
        </div>
      </div>
    </>
  );
};


export default function App() {
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState(null);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  const [availableFilters, setAvailableFilters] = useState([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  
  const [activeFilters, setActiveFilters] = useState([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Fetch analysis types on initial load
  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoadingTypes(true);
      const types = await bigQueryService.getAnalysisTypes();
      setAnalysisTypes(types);
      setIsLoadingTypes(false);
    };
    fetchTypes();
  }, []);

  // Fetch available filters when the analysis type changes
  useEffect(() => {
    if (!selectedAnalysisType) {
      setAvailableFilters([]);
      setActiveFilters([]); // Clear active filters when type changes
      return;
    }
    const fetchFilters = async () => {
      setIsLoadingFilters(true);
      const filters = await bigQueryService.getFiltersForType(selectedAnalysisType);
      setAvailableFilters(filters);
      setIsLoadingFilters(false);
    };
    fetchFilters();
  }, [selectedAnalysisType]);

  const handleAddFilter = (filterToAdd) => {
    const newFilter = {
      ...filterToAdd,
      id: crypto.randomUUID(), // Unique ID for this specific instance of the filter
      operator: filterToAdd.available_operators?.[0] || 'is equal to', // Default to the first available operator
      value: '' // Default empty value
    };
    setActiveFilters(prev => [...prev, newFilter]);
    setIsSelectorOpen(false); // Close the panel after adding a filter
  };

  const handleRemoveFilter = (filterId) => {
    setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  };
  
  const handleUpdateFilter = (filterId, updatedFilter) => {
    setActiveFilters(prev => prev.map(f => f.id === filterId ? updatedFilter : f));
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Report Filter Demo</h1>
            <p className="text-gray-600 mt-1">Select an analysis type to build your filter query.</p>
        </header>
        
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Choose Analysis Type</h2>
            {isLoadingTypes ? (
                <div>Loading...</div>
            ) : (
                <div className="flex flex-wrap gap-3">
                    {analysisTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => setSelectedAnalysisType(type)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                                selectedAnalysisType === type
                                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-200 text-gray-700 hover:bg-blue-200'
                            }`}
                        >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            )}
        </div>
        
        {selectedAnalysisType && (
             <div className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Build Your Filter</h2>
                 {isLoadingFilters ? <p>Loading filters...</p> : (
                    <>
                        <div className="space-y-2 mb-4">
                            {activeFilters.length > 0 ? (
                                activeFilters.map(filter => (
                                    <ActiveFilterRow 
                                        key={filter.id} 
                                        activeFilter={filter}
                                        onRemove={handleRemoveFilter}
                                        onUpdate={handleUpdateFilter}
                                    />
                                ))
                            ) : (
                                <p className="text-gray-500 text-center p-4 border-2 border-dashed rounded-lg">No filters applied yet.</p>
                            )}
                        </div>
                        <button 
                            onClick={() => setIsSelectorOpen(true)}
                            className="w-full text-blue-600 font-semibold border-2 border-dashed border-gray-300 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-500 transition-all"
                        >
                            + Add filter
                        </button>
                    </>
                 )}
            </div>
        )}
      </div>

      <FilterSelectorPanel 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        availableFilters={availableFilters}
        onAddFilter={handleAddFilter}
      />
    </div>
  );
}

