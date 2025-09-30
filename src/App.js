import React, { useState, useEffect, useMemo } from 'react';

// --- BigQuery Service (Unchanged) ---
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
  },
  getSegmentationsForType: async (analysisType) => {
    try {
      const response = await fetch(`/api/query?queryName=getSegmentationsForType&analysisType=${analysisType}`);
      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
      return await response.json();
    } catch (error) {
       console.error(`Failed to fetch segmentations for ${analysisType}:`, error);
       return [];
    }
  },
  getMetricsForType: async (analysisType) => {
    try {
        const response = await fetch(`/api/query?queryName=getMetricsForType&analysisType=${analysisType}`);
        if(!response.ok) throw new Error(`API Error: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch metrics for ${analysisType}:`, error);
        return [];
    }
  }
};

// --- Mock Data for Mandatory Selections (Unchanged) ---
const MOCK_TIME_PERIODS = ['This Quarter', 'Last Quarter', 'This Year', 'Last Year'];
const MOCK_ATTRIBUTION_MODELS = ['First Touch', 'Last Touch', 'AI Model'];
const MOCK_AUDIENCES = ['ICP', 'Customers', 'Current Pipeline'];


// --- React Components ---

const MandatorySelections = ({ type, selections, setSelections }) => {
    const showAttribution = ['spend_performance', 'session_activity_performance'].includes(type);
    const showAudience = type === 'audience_engagement';

    if (!type) return null;

    return (
        <section className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Mandatory Selections</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                    <select
                        value={selections.timePeriod}
                        onChange={(e) => setSelections(prev => ({ ...prev, timePeriod: e.target.value }))}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                    >
                        {MOCK_TIME_PERIODS.map(period => <option key={period} value={period}>{period}</option>)}
                    </select>
                </div>

                {showAttribution && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attribution Model</label>
                        <select
                            value={selections.attributionModel}
                            onChange={(e) => setSelections(prev => ({ ...prev, attributionModel: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            {MOCK_ATTRIBUTION_MODELS.map(model => <option key={model} value={model}>{model}</option>)}
                        </select>
                    </div>
                )}

                {showAudience && (
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                        <select
                            value={selections.audience}
                            onChange={(e) => setSelections(prev => ({ ...prev, audience: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                        >
                            {MOCK_AUDIENCES.map(audience => <option key={audience} value={audience}>{audience}</option>)}
                        </select>
                    </div>
                )}
            </div>
        </section>
    );
};


const FilterValueInput = ({ activeFilter, onUpdate }) => {
  const [options, setOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoading(true);
      const fetchedOptions = await bigQueryService.getPropertyValues(activeFilter.property_id);
      setOptions(fetchedOptions || []);
      setIsLoading(false);
    };
    fetchOptions();
  }, [activeFilter.property_id]);

  if (isLoading) {
    return <select className="p-1 border border-gray-300 rounded-md text-sm flex-grow bg-gray-100" disabled><option>Loading values...</option></select>;
  }

  if (options.length > 0) {
    return (
      <select
        className="p-1 border border-gray-300 rounded-md text-sm flex-grow"
        value={activeFilter.value}
        onChange={(e) => onUpdate(activeFilter.id, { ...activeFilter, value: e.target.value })}
      >
        <option value="">Select value</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    );
  }
  
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

const ActiveFilterRow = ({ activeFilter, onRemove, onUpdate }) => {
  const operators = activeFilter.available_operators || ['is equal to'];

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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
      </button>
    </div>
  );
};

const SelectionPanel = ({ items, onSelectItem, onClose, isOpen, mode, selectedItems = [] }) => {
    const [collapsedSections, setCollapsedSections] = useState({});

    const groupedItems = useMemo(() => {
        const key = mode === 'metrics' ? 'metric_group_label' : 'property_scope_label';
        return items.reduce((acc, item) => {
            const scope = item[key] || item.property_scope || 'General';
            if (!acc[scope]) acc[scope] = [];
            acc[scope].push(item);
            return acc;
        }, {});
    }, [items, mode]);

    useEffect(() => {
        if (isOpen) {
            setCollapsedSections({});
        }
    }, [isOpen, items]);

    const toggleSection = (scope) => {
        setCollapsedSections(prev => ({
            ...prev,
            [scope]: !prev[scope]
        }));
    };

    const title = mode === 'filters' ? 'Add filter' : (mode === 'segmentations' ? 'Select segmentation' : 'Select metrics');
    const idKey = mode === 'metrics' ? 'metric_id' : 'property_id';
    const labelKey = mode === 'metrics' ? 'metric_label' : 'property_label';

    const ChevronIcon = ({ isCollapsed }) => (
        <svg
            className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-90'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );

    return (
        <>
            <div className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>
            <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    <header className="flex items-center justify-between p-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </header>
                    
                    <div className="flex-grow overflow-y-auto p-4">
                        {Object.keys(groupedItems).length > 0 ? (
                            Object.entries(groupedItems).map(([scope, scopeItems]) => {
                                const isCollapsed = collapsedSections[scope];
                                return (
                                    <div key={scope} className="py-2">
                                        <h3 
                                            className="flex items-center justify-between text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 cursor-pointer select-none hover:text-gray-800"
                                            onClick={() => toggleSection(scope)}
                                        >
                                            <span>{scope}</span>
                                            <ChevronIcon isCollapsed={isCollapsed} />
                                        </h3>
                                        {!isCollapsed && (
                                            <ul className="space-y-1 mt-2 border-l-2 border-gray-200 pl-4">
                                                {scopeItems.map(item => {
                                                    const isSelected = selectedItems.some(selected => selected[idKey] === item[idKey]);
                                                    return (
                                                        <li 
                                                          key={item[idKey]} 
                                                          className={`flex items-center justify-between p-2 text-gray-700 rounded-md cursor-pointer transition-colors ${isSelected ? 'bg-blue-200' : 'hover:bg-blue-100'}`} 
                                                          onClick={() => onSelectItem(item)}
                                                        >
                                                            {item[labelKey]}
                                                            {isSelected && mode === 'metrics' && <span className="text-blue-600">&#10003;</span>}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-gray-500 text-center p-4">No available options for this analysis type.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

const ReportConfigCanvas = ({ config }) => {
  const jsonString = JSON.stringify(config, null, 2); 

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-md h-full flex flex-col">
      <h2 className="text-lg font-semibold text-gray-200 mb-4 flex-shrink-0">Live Report Configuration</h2>
      <div className="bg-gray-900 p-4 rounded-md overflow-auto flex-grow">
        <pre className="text-sm text-green-300">
          <code>
            {jsonString}
          </code>
        </pre>
      </div>
    </div>
  );
};


export default function App() {
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState(null);
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);

  const defaultMandatorySelections = {
      timePeriod: 'This Quarter',
      attributionModel: 'AI Model',
      audience: 'ICP',
  };

  const [mandatorySelections, setMandatorySelections] = useState(defaultMandatorySelections);
  const [availableFilters, setAvailableFilters] = useState([]);
  const [isLoadingFilters, setIsLoadingFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState([]);
  
  const [availableSegmentations, setAvailableSegmentations] = useState([]);
  const [selectedSegmentation, setSelectedSegmentation] = useState(null);
  const [isLoadingSegmentations, setIsLoadingSegmentations] = useState(false);

  const [availableMetrics, setAvailableMetrics] = useState([]);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(false);
  
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [panelMode, setPanelMode] = useState('filters');

  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoadingTypes(true);
      const types = await bigQueryService.getAnalysisTypes();
      setAnalysisTypes(types);
      setIsLoadingTypes(false);
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    setActiveFilters([]);
    setSelectedSegmentation(null);
    setSelectedMetrics([]);
    setMandatorySelections(defaultMandatorySelections);

    if (!selectedAnalysisType) {
      setAvailableFilters([]);
      setAvailableSegmentations([]);
      setAvailableMetrics([]);
      return;
    }
    
    const fetchDataForType = async () => {
      setIsLoadingFilters(true);
      setIsLoadingSegmentations(true);
      setIsLoadingMetrics(true);
      const [filters, segmentations, metrics] = await Promise.all([
        bigQueryService.getFiltersForType(selectedAnalysisType),
        bigQueryService.getSegmentationsForType(selectedAnalysisType),
        bigQueryService.getMetricsForType(selectedAnalysisType)
      ]);
      setAvailableFilters(filters);
      setAvailableSegmentations(segmentations);
      setAvailableMetrics(metrics);
      setIsLoadingFilters(false);
      setIsLoadingSegmentations(false);
      setIsLoadingMetrics(false);
    };
    fetchDataForType();
  }, [selectedAnalysisType]);

  const reportConfig = useMemo(() => {
    if (!selectedAnalysisType) {
        return { message: "Select an analysis type to begin building your report." };
    }
    
    const mandatory = {};
    mandatory.timePeriod = mandatorySelections.timePeriod;
    if (['spend_performance', 'session_activity_performance'].includes(selectedAnalysisType)) {
        mandatory.attributionModel = mandatorySelections.attributionModel;
    }
    if (selectedAnalysisType === 'audience_engagement') {
        mandatory.audience = mandatorySelections.audience;
    }

    return {
        analysisType: selectedAnalysisType,
        mandatorySelections: mandatory,
        filters: activeFilters.map(f => ({
            propertyId: f.property_id,
            propertyLabel: f.property_label,
            operator: f.operator,
            value: f.value,
        })),
        segmentation: selectedSegmentation ? {
            propertyId: selectedSegmentation.property_id,
            propertyLabel: selectedSegmentation.property_label,
        } : null,
        metrics: selectedMetrics.map(m => ({
            metricId: m.metric_id,
            metricLabel: m.metric_label,
        })),
    };
  }, [selectedAnalysisType, activeFilters, selectedSegmentation, selectedMetrics, mandatorySelections]);


  const handleAddFilter = (filterToAdd) => {
    const newFilter = { ...filterToAdd, id: crypto.randomUUID(), operator: filterToAdd.available_operators?.[0] || 'equals', value: '' };
    setActiveFilters(prev => [...prev, newFilter]);
    setIsSelectorOpen(false);
  };

  const handleSetSegmentation = (segmentation) => {
    setSelectedSegmentation(segmentation);
    setIsSelectorOpen(false);
  };
  
  const handleToggleMetric = (metric) => {
    setSelectedMetrics(prev => {
        const isSelected = prev.some(m => m.metric_id === metric.metric_id);
        if (isSelected) {
            return prev.filter(m => m.metric_id !== metric.metric_id);
        } else {
            return [...prev, metric];
        }
    });
  };

  const handlePanelSelectItem = (item) => {
    if (panelMode === 'filters') handleAddFilter(item);
    else if (panelMode === 'segmentations') handleSetSegmentation(item);
    else if (panelMode === 'metrics') handleToggleMetric(item);
  };

  const handleRemoveFilter = (filterId) => setActiveFilters(prev => prev.filter(f => f.id !== filterId));
  const handleUpdateFilter = (filterId, updatedFilter) => setActiveFilters(prev => prev.map(f => f.id === filterId ? updatedFilter : f));

  const openPanel = (mode) => {
    setPanelMode(mode);
    setIsSelectorOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto p-4 sm:p-8">

        <div className="lg:col-span-1">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Report Builder Demo</h1>
                <p className="text-gray-600 mt-1">Configure your report using the panels below.</p>
            </header>
            
            <main className="space-y-6">
                <section className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">1. Choose Analysis Type</h2>
                    {isLoadingTypes ? <p>Loading analysis types...</p> : (
                        <div className="flex flex-wrap gap-3">{analysisTypes.map(type => (
                            <button key={type} onClick={() => setSelectedAnalysisType(type)} className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${selectedAnalysisType === type ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-gray-200 text-gray-700 hover:bg-blue-200'}`}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</button>
                        ))}</div>
                    )}
                </section>
                
                {selectedAnalysisType && (
                  <>
                    <MandatorySelections type={selectedAnalysisType} selections={mandatorySelections} setSelections={setMandatorySelections} />
                    
                    <section className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">3. Build Your Filter</h2>
                        {isLoadingFilters ? <p>Loading filters...</p> : (
                            <>
                                <div className="space-y-2 mb-4">
                                    {activeFilters.length > 0 ? (
                                        activeFilters.map(filter => <ActiveFilterRow key={filter.id} activeFilter={filter} onRemove={handleRemoveFilter} onUpdate={handleUpdateFilter}/>)
                                    ) : ( <p className="text-gray-500 text-center p-4 border-2 border-dashed rounded-lg">No filters applied yet.</p> )}
                                </div>
                                <button onClick={() => openPanel('filters')} className="w-full text-blue-600 font-semibold border-2 border-dashed border-gray-300 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-500 transition-all">+ Add filter</button>
                            </>
                        )}
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">4. Select Segmentation</h2>
                        {isLoadingSegmentations ? <p>Loading segmentations...</p> : (
                          <>
                            {selectedSegmentation ? (
                              <div className="flex items-center justify-between p-3 bg-blue-50 text-blue-800 font-medium rounded-lg">
                                <span>{selectedSegmentation.property_label}</span>
                                <button onClick={() => setSelectedSegmentation(null)} className="text-gray-500 hover:text-red-600 p-1"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                              </div>
                            ) : (
                              <button onClick={() => openPanel('segmentations')} className="w-full text-blue-600 font-semibold border-2 border-dashed border-gray-300 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-500 transition-all">+ Select segmentation</button>
                            )}
                          </>
                        )}
                    </section>

                    <section className="bg-white p-6 rounded-lg shadow-md animate-fade-in">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">5. Select Metrics</h2>
                        {isLoadingMetrics ? <p>Loading metrics...</p> : (
                          <>
                            <div className="space-y-2 mb-4">
                                {selectedMetrics.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedMetrics.map(metric => (
                                            <div key={metric.metric_id} className="flex items-center gap-2 p-2 bg-blue-50 text-blue-800 font-medium rounded-lg text-sm">
                                                <span>{metric.metric_label}</span>
                                                <button onClick={() => handleToggleMetric(metric)} className="text-blue-500 hover:text-red-600">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : ( 
                                    <p className="text-gray-500 text-center p-4 border-2 border-dashed rounded-lg">No metrics selected yet.</p> 
                                )}
                            </div>
                            <button onClick={() => openPanel('metrics')} className="w-full text-blue-600 font-semibold border-2 border-dashed border-gray-300 rounded-lg p-3 hover:bg-blue-50 hover:border-blue-500 transition-all">+ Add metric</button>
                          </>
                        )}
                    </section>
                  </>
                )}
            </main>
        </div>

        <div className="lg:col-span-1 lg:sticky top-8 h-fit lg:h-[calc(100vh-4rem)]">
          <ReportConfigCanvas config={reportConfig} />
        </div>

      </div>

      <SelectionPanel 
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        mode={panelMode}
        items={panelMode === 'filters' ? availableFilters : (panelMode === 'segmentations' ? availableSegmentations : availableMetrics)}
        selectedItems={panelMode === 'metrics' ? selectedMetrics : []}
        onSelectItem={handlePanelSelectItem}
      />
    </div>
  );
}