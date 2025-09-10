import React, { useState, useEffect } from 'react';

// --- Mock Data Service ---
// This simulates the data we would get from BigQuery.
const mockData = {
  analysis_types: ['journeys', 'performance', 'attribution', 'revenue'],
  filters: {
    journeys: [
      { property_id: '1', property_label: 'Source', property_scope_label: 'UTM' },
      { property_id: '2', property_label: 'Medium', property_scope_label: 'UTM' },
      { property_id: '3', property_label: 'Campaign', property_scope_label: 'UTM' },
      { property_id: '4', property_label: 'Contact ID', property_scope_label: 'Identification' },
      { property_id: '5', property_label: 'Company Name', property_scope_label: 'Company' },
      { property_id: '6', property_label: 'Industry', property_scope_label: 'Company' },
    ],
    performance: [
      { property_id: '7', property_label: 'Country', property_scope_label: 'Location' },
      { property_id: '8', property_label: 'City', property_scope_label: 'Location' },
      { property_id: '9', property_label: 'Device Type', property_scope_label: 'Technology' },
      { property_id: '10', property_label: 'Browser', property_scope_label: 'Technology' },
      { property_id: '5', property_label: 'Company Name', property_scope_label: 'Company' },
    ],
    attribution: [
       { property_id: '1', property_label: 'Source', property_scope_label: 'UTM' },
       { property_id: '2', property_label: 'Medium', property_scope_label: 'UTM' },
       { property_id: '11', property_label: 'Landing Page', property_scope_label: 'On-site Behavior' },
       { property_id: '12', property_label: 'Form Submissions', property_scope_label: 'On-site Behavior' },
    ],
     revenue: [
       { property_id: '13', property_label: 'Deal Stage', property_scope_label: 'Sales' },
       { property_id: '14', property_label: 'Deal Amount', property_scope_label: 'Sales' },
       { property_id: '6', property_label: 'Industry', property_scope_label: 'Company' },
    ],
  }
};

const mockBigQueryService = {
  getAnalysisTypes: async () => {
    console.log("Fetching analysis types...");
    await new Promise(resolve => setTimeout(resolve, 300));
    return mockData.analysis_types;
  },
  getFiltersForType: async (analysisType) => {
    console.log(`Fetching filters for: ${analysisType}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockData.filters[analysisType] || [];
  }
};


// --- React Components ---

const FilterDisplay = ({ selectedAnalysisType }) => {
  const [filters, setFilters] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!selectedAnalysisType) {
        setFilters({});
        return;
    };

    const fetchFilters = async () => {
      setIsLoading(true);
      const fetchedFilters = await mockBigQueryService.getFiltersForType(selectedAnalysisType);
      
      const grouped = fetchedFilters.reduce((acc, filter) => {
        const scope = filter.property_scope_label;
        if (!acc[scope]) {
          acc[scope] = [];
        }
        acc[scope].push(filter);
        return acc;
      }, {});

      setFilters(grouped);
      setIsLoading(false);
    };

    fetchFilters();
  }, [selectedAnalysisType]);

  if (!selectedAnalysisType) {
    return null;
  }

  return (
    <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Available Filters</h2>
      {isLoading ? (
        <div className="text-gray-500">Loading filters...</div>
      ) : Object.keys(filters).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(filters).map(([scope, filterList]) => (
            <div key={scope}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{scope}</h3>
              <ul className="space-y-2">
                {filterList.map(filter => (
                  <li key={filter.property_id} className="p-2 bg-white rounded-md shadow-sm border border-gray-200 text-gray-700 cursor-pointer hover:bg-gray-100">
                    {filter.property_label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-500 text-center mt-8">No filters available for this analysis type.</div>
      )}
    </div>
  );
};


export default function App() {
  const [analysisTypes, setAnalysisTypes] = useState([]);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTypes = async () => {
      setIsLoading(true);
      const types = await mockBigQueryService.getAnalysisTypes();
      setAnalysisTypes(types);
      setIsLoading(false);
    };
    fetchTypes();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="max-w-4xl mx-auto p-4 sm:p-8">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Report Filter Demo</h1>
            <p className="text-gray-600 mt-1">Select an analysis type to see available filters.</p>
        </header>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Choose Analysis Type</h2>
            {isLoading ? (
                <div>Loading analysis types...</div>
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
        
        <FilterDisplay selectedAnalysisType={selectedAnalysisType} />
      </div>
    </div>
  );
}
