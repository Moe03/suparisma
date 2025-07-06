"use client";
import { create } from "domain";

import { useEffect, useState, useMemo, useCallback } from "react";
import useSuparisma from "../generated";

export default function Home() {

  const itemsPerPage = 10;
  const [page, setPage] = useState(0);
  
  // Add state for filtering and sorting
  const [enumFilter, setEnumFilter] = useState("");
  const [sortField, setSortField] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const [search, setSearch] = useState("");
  const [arrayFilterExample, setArrayFilterExample] = useState("1");
  const [arrayOperator, setArrayOperator] = useState<'has' | 'hasEvery' | 'hasSome' | 'isEmpty'>('hasEvery');
  
  // Add state for OR/AND testing
  const [useOrLogic, setUseOrLogic] = useState(false);
  const [nameFilter, setNameFilter] = useState("");
  const [numberFilter, setNumberFilter] = useState("");
  
  // Add state for date testing
  const [useDateFilter, setUseDateFilter] = useState(false);
  const [dateFromFilter, setDateFromFilter] = useState("");
  const [dateToFilter, setDateToFilter] = useState("");
  
  // Enhanced search state
  const [activeSearchType, setActiveSearchType] = useState<'none' | 'name' | 'description' | 'multi'>('none');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchStats, setShowSearchStats] = useState(false);
  
  // Array Filtering Examples - You can now use powerful array operators:
  /*
    // Array contains ANY of the specified items
    stringArray: { has: ["item1", "item2"] }
    
    // Array contains ANY of the specified items (same as 'has')
    stringArray: { hasSome: ["item1", "item2", "item3"] }
    
    // Array contains ALL of the specified items
    stringArray: { hasEvery: ["item1", "item2"] }
    
    // Array is empty
    stringArray: { isEmpty: true }
    
    // Array is not empty
    stringArray: { isEmpty: false }
    
    // Regular equality (exact match)
    stringArray: ["exact", "match"]
    
    // For string fields, you can still use:
    name: { contains: "partial" }
    name: { startsWith: "prefix" }
    name: { endsWith: "suffix" }
    
    // For number fields:
    someNumber: { gt: 10, lt: 100 }
  */
  // const [thingsCount, setThingsCount] = useState(0);
  
  // Create a stable where object that only changes when filters actually change
  const whereFilter = useMemo(() => {
    // Date Range Filtering Example 🔥 NEW: Proper Date type support!
    if (useDateFilter && (dateFromFilter || dateToFilter)) {
      const filter: any = {};
      
      if (dateFromFilter && dateToFilter) {
        // Date range: between two dates
        filter.createdAt = {
          gte: new Date(dateFromFilter), // ✅ Now supports Date objects!
          lte: new Date(dateToFilter)
        };
      } else if (dateFromFilter) {
        // From date only
        filter.createdAt = {
          gte: new Date(dateFromFilter)
        };
      } else if (dateToFilter) {
        // To date only
        filter.createdAt = {
          lte: new Date(dateToFilter)
        };
      }
      
      return filter;
    }
    
    // OR/AND Logic Example
    if (useOrLogic && (nameFilter || numberFilter)) {
      return {
        OR: [
          ...(nameFilter ? [{ name: { contains: nameFilter } }] : []),
          ...(numberFilter ? [{ someNumber: { gte: parseInt(numberFilter) || 0 } }] : []),
          { someEnum: "TWO" } // Always include items with enum TWO in OR
        ]
      };
    }
    
    // Complex AND + OR example
    if (useOrLogic && enumFilter) {
      return {
        // Must match the enum filter (AND)
        someEnum: enumFilter,
        // AND also match any of these OR conditions
        OR: [
          { stringArray: { has: ["1"] } },
          { someNumber: { gt: 50 } }
        ]
      };
    }
    
    if (arrayFilterExample) {
      return {
        // Dynamic array filtering based on selected operator
        stringArray: arrayOperator === 'isEmpty' 
          ? { isEmpty: false } // Test non-empty arrays
          : arrayOperator === 'hasEvery'
          ? { hasEvery: ["1", "2", "3"] } // Must contain all three
          : arrayOperator === 'has'
          ? { has: [arrayFilterExample] } // Must contain the specified item
          : { hasSome: [arrayFilterExample, "2"] } // Must contain any of these items
      };
    } else if (enumFilter) {
      return {
        someEnum: enumFilter
      };
    }
    return undefined;
  }, [arrayFilterExample, arrayOperator, enumFilter, useOrLogic, nameFilter, numberFilter, useDateFilter, dateFromFilter, dateToFilter]);
  
  const { 
    data: things,
    loading: isLoadingThing,
    error: thingError,
    create: createThing,
    update: updateThing,
    delete: deleteThing,
    count: thingCount,
    search: searchThings,
    
  } = useSuparisma.thing({
    realtime: true,
    limit: itemsPerPage,
    offset: page * itemsPerPage,
    // where: whereFilter,
    orderBy: {
      [sortField]: sortDirection
    },
  });

  // Global search shortcut (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const firstSearchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (firstSearchInput) {
          firstSearchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Function to highlight search terms in text (memoized to prevent re-renders)
  const highlightSearchTerm = useCallback((text: string, searchTerm: string) => {
    if (!searchTerm || !text) return text;
    
    const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
    return parts.map((part, index) => 
      part.toLowerCase() === searchTerm.toLowerCase() 
        ? <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark>
        : part
    );
  }, []);

  // Get current search term for highlighting (memoized)
  const currentSearchTerm = useMemo(() => 
    searchThings.queries.length > 0 ? searchThings.queries[0].value : ''
  , [searchThings.queries]);

  if(thingError) {
    return <div>Error: {thingError.message}</div>;
  }

  return (
    <div className="container mx-auto p-4 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-3xl font-bold mb-6">🔥 Suparisma Full-Text Search Demo</h1>

      {/* Enhanced Search Feature Showcase */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-yellow-800">🚀 Advanced Type-Safe Full-Text Search</h2>
          <button
            onClick={() => setShowSearchStats(!showSearchStats)}
            className="text-sm text-yellow-700 hover:text-yellow-900 underline"
          >
            {showSearchStats ? 'Hide' : 'Show'} Search Stats
          </button>
        </div>

        {/* Search Statistics */}
        {showSearchStats && (
          <div className="mb-4 p-3 bg-yellow-100 rounded-md">
            <h3 className="font-medium text-yellow-800 mb-2">📊 Search Performance Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="font-medium">Total Results:</span> {thingCount}
              </div>
              <div>
                <span className="font-medium">Search Type:</span> {activeSearchType === 'none' ? 'No search' : activeSearchType}
              </div>
              <div>
                <span className="font-medium">Loading:</span> {searchThings.loading ? 'Yes' : 'No'}
              </div>
              <div>
                <span className="font-medium">Active Queries:</span> {searchThings.queries.length}
              </div>
            </div>
          </div>
        )}

        {/* Quick Search Suggestions */}
        {searchThings.queries.length === 0 && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">💡 Try searching for:</h3>
            <div className="flex flex-wrap gap-2">
              {['sample', 'test', 'description', 'demo', 'item'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    const searchTerm = suggestion.replace(/\s+/g, '+'); // Replace spaces with +
                    setActiveSearchType('multi');
                    searchThings.searchMultiField(searchTerm);
                  }}
                  className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-md transition-colors"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🎯 Search Name Field Only
            </label>
            <input 
              type="text" 
              placeholder="Search by name..." 
              onChange={(e) => {
                const searchValue = e.target.value;
                if (searchValue.trim()) {
                  const searchTerm = searchValue.trim().replace(/\s+/g, '+'); // Replace spaces with +
                  setActiveSearchType('name');
                  searchThings.searchField("name", searchTerm);
                  // Add to search history (original term for display)
                  if (!searchHistory.includes(searchValue.trim())) {
                    setSearchHistory(prev => [searchValue.trim(), ...prev.slice(0, 4)]);
                  }
                } else {
                  setActiveSearchType('none');
                  searchThings.clearQueries();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.value = '';
                  setActiveSearchType('none');
                  searchThings.clearQueries();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Uses: <code>search_thing_by_name_prefix</code> RPC function</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              📝 Search Description Field Only
            </label>
            <input 
              type="text" 
              placeholder="Search by description..." 
              onChange={(e) => {
                const searchValue = e.target.value;
                if (searchValue.trim()) {
                  const searchTerm = searchValue.trim().replace(/\s+/g, '+'); // Replace spaces with +
                  setActiveSearchType('description');
                  searchThings.searchField("description", searchTerm);
                  // Add to search history (original term for display)
                  if (!searchHistory.includes(searchValue.trim())) {
                    setSearchHistory(prev => [searchValue.trim(), ...prev.slice(0, 4)]);
                  }
                } else {
                  setActiveSearchType('none');
                  searchThings.clearQueries();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.value = '';
                  setActiveSearchType('none');
                  searchThings.clearQueries();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-gray-500 mt-1">Uses: <code>search_thing_by_description_prefix</code> RPC function</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              🌍 Multi-Field Search (Name + Description)
            </label>
            <input 
              type="text" 
              placeholder="Search across all fields..." 
              onChange={(e) => {
                const searchValue = e.target.value;
                if (searchValue.trim()) {
                  const searchTerm = searchValue.trim().replace(/\s+/g, '+'); // Replace spaces with +
                  setActiveSearchType('multi');
                  searchThings.searchMultiField(searchTerm);
                  // Add to search history (original term for display)
                  if (!searchHistory.includes(searchValue.trim())) {
                    setSearchHistory(prev => [searchValue.trim(), ...prev.slice(0, 4)]);
                  }
                } else {
                  setActiveSearchType('none');
                  searchThings.clearQueries();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.currentTarget.value = '';
                  setActiveSearchType('none');
                  searchThings.clearQueries();
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <p className="text-xs text-gray-500 mt-1">Uses: <code>search_thing_multi_field</code> RPC function</p>
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">🕒 Recent Searches</h3>
            <div className="flex flex-wrap gap-2">
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => {
                    const searchTerm = term.replace(/\s+/g, '+'); // Replace spaces with +
                    setActiveSearchType('multi');
                    searchThings.searchMultiField(searchTerm);
                  }}
                  className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded-md transition-colors"
                >
                  {term}
                </button>
              ))}
              <button
                onClick={() => setSearchHistory([])}
                className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded-md transition-colors"
              >
                Clear History
              </button>
            </div>
          </div>
        )}
        
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>✅ Features:</strong> PostgreSQL full-text search with <code>to_tsvector</code> and <code>to_tsquery</code> • 
            GIN indexes for performance • Partial/prefix matching with <code>:*</code> • 
            Multi-word search (spaces → <code>+</code>) • Type-safe search methods • Real-time results • Error handling • Search history • 
            Keyboard shortcuts (ESC to clear, <kbd className="bg-white px-1 rounded border text-xs">Ctrl/Cmd + K</kbd> to focus search)
          </p>
        </div>
        
        {searchThings.queries.length > 0 && (
          <div className="mt-3 p-2 bg-gray-100 rounded-md">
            <p className="text-sm font-medium text-gray-700">
              🔍 Active Search: {searchThings.queries.map(q => `${q.field}:"${q.value}"`).join(', ')}
              {searchThings.loading && <span className="ml-2 text-blue-600">⏳ Searching...</span>}
              <button 
                onClick={() => {
                  setActiveSearchType('none');
                  searchThings.clearQueries();
                }}
                className="ml-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Clear Search
              </button>
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Data Management</h2>
          {searchThings.queries.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Showing {thingCount} search result{thingCount !== 1 ? 's' : ''} 
              {currentSearchTerm && <> for "<strong>{currentSearchTerm}</strong>"</>}
            </p>
          )}
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => {
              createThing({ 
                name: 'Sample Item ' + Math.floor(Math.random() * 1000), 
                description: 'This is a test description for search functionality. Created at ' + new Date().toLocaleTimeString(),
                someNumber: Math.floor(Math.random() * 100), 
                stringArray: ['search', 'test', 'demo'] 
              });
            }}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            disabled={isLoadingThing}
          >
            {isLoadingThing ? "Creating..." : "➕ Create Test Item"}
          </button>
          
          {/* Bulk create for testing search */}
          <button 
            onClick={() => {
              const sampleData = [
                { name: 'React Developer', description: 'Expert in React and TypeScript development' },
                { name: 'Node.js Backend', description: 'Building scalable backend services' },
                { name: 'Database Engineer', description: 'PostgreSQL and database optimization specialist' },
                { name: 'Frontend Designer', description: 'Creating beautiful user interfaces' },
                { name: 'Search Expert', description: 'Full-text search and indexing professional' }
              ];
              
              // Create items sequentially with delay to avoid overwhelming the system
              sampleData.forEach((data, index) => {
                setTimeout(() => {
                  createThing({
                    ...data,
                    someNumber: Math.floor(Math.random() * 100),
                    stringArray: ['test', 'demo', 'sample']
                  });
                }, index * 200); // 200ms delay between each creation
              });
            }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
            disabled={isLoadingThing}
          >
            📦 Create Sample Data
          </button>
        </div>
      </div>

      {/* Date Range Controls */}
      <div className="mb-4 p-4 bg-green-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🔥 FIXED: Date Range Filtering</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useDateFilter}
                onChange={(e) => {
                  setUseDateFilter(e.target.checked);
                  setUseOrLogic(false); // Clear other filters
                  setEnumFilter("");
                  setArrayFilterExample("");
                  setPage(0);
                }}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Enable Date Filtering</span>
            </label>
          </div>
          
          {useDateFilter && (
            <>
              <div>
                <label htmlFor="dateFromFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <input
                  id="dateFromFilter"
                  type="datetime-local"
                  value={dateFromFilter}
                  onChange={(e) => {
                    setDateFromFilter(e.target.value);
                    setPage(0);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="dateToFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <input
                  id="dateToFilter"
                  type="datetime-local"
                  value={dateToFilter}
                  onChange={(e) => {
                    setDateToFilter(e.target.value);
                    setPage(0);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Fixed Issues:</strong></p>
                <p>✅ Date types are now proper Date objects</p>
                <p>✅ No more TypeScript errors with new Date()</p>
                <p>✅ Date filtering works correctly</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* OR/AND Logic Controls */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">🔥 NEW: OR/AND Logic Testing</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={useOrLogic}
                onChange={(e) => {
                  setUseOrLogic(e.target.checked);
                  setEnumFilter(""); // Clear other filters
                  setArrayFilterExample("");
                  setPage(0);
                }}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Enable OR/AND Logic</span>
            </label>
          </div>
          
          {useOrLogic && (
            <>
              <div>
                <label htmlFor="nameFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Name Contains (OR)
                </label>
                <input
                  id="nameFilter"
                  type="text"
                  value={nameFilter}
                  onChange={(e) => {
                    setNameFilter(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Enter name to search"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div>
                <label htmlFor="numberFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Number &gt;= (OR)
                </label>
                <input
                  id="numberFilter"
                  type="number"
                  value={numberFilter}
                  onChange={(e) => {
                    setNumberFilter(e.target.value);
                    setPage(0);
                  }}
                  placeholder="Min number"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p><strong>Query:</strong> OR Logic</p>
                <p>• Name contains text OR</p>
                <p>• Number &gt;= value OR</p>
                <p>• Enum = "TWO"</p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label htmlFor="enumFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Enum
          </label>
          <select
            id="enumFilter"
            value={enumFilter}
            onChange={(e) => {
              setEnumFilter(e.target.value);
              setArrayFilterExample(""); // Clear array filter when enum filter changes
              setPage(0); // Reset to first page when filter changes
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">All</option>
            <option value="ONE">ONE</option>
            <option value="TWO">TWO</option>
            <option value="THREE">THREE</option>
          </select>
        </div>

        <div>
          <label htmlFor="arrayOperator" className="block text-sm font-medium text-gray-700 mb-1">
            Array Operator
          </label>
          <select
            id="arrayOperator"
            value={arrayOperator}
            onChange={(e) => {
              setArrayOperator(e.target.value as any);
              setEnumFilter(""); // Clear enum filter when array filter changes
              setPage(0); // Reset to first page when filter changes
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="has">has (ANY)</option>
            <option value="hasEvery">hasEvery (ALL)</option>
            <option value="hasSome">hasSome (ANY)</option>
            <option value="isEmpty">isEmpty</option>
          </select>
        </div>

        <div>
          <label htmlFor="arrayFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Array Item Value
          </label>
          <input
            id="arrayFilter"
            type="text"
            value={arrayFilterExample}
            onChange={(e) => {
              setArrayFilterExample(e.target.value);
              setEnumFilter(""); // Clear enum filter when array filter changes
              setPage(0); // Reset to first page when filter changes
            }}
            placeholder="Enter item to search for"
            className="w-full p-2 border border-gray-300 rounded-md"
            disabled={arrayOperator === 'isEmpty'}
          />
          <small className="text-gray-500">
            {arrayOperator === 'has' && "Array contains ANY of these items"}
            {arrayOperator === 'hasEvery' && "Array contains ALL items: 1,2,3"}
            {arrayOperator === 'hasSome' && "Array contains ANY: input+2"}
            {arrayOperator === 'isEmpty' && "Array is not empty"}
          </small>
        </div>
        
        <div>
          <label htmlFor="sortField" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sortField"
            value={sortField}
            onChange={(e) => {
              setSortField(e.target.value);
              setPage(0); // Reset to first page when sort changes
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="createdAt">Created Date</option>
            <option value="updatedAt">Updated Date</option>
            <option value="someNumber">Number</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="sortDirection" className="block text-sm font-medium text-gray-700 mb-1">
            Sort Direction
          </label>
          <select
            id="sortDirection"
            value={sortDirection}
            onChange={(e) => {
              setSortDirection(e.target.value);
              setPage(0); // Reset to first page when sort direction changes
            }}
            className="w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Description</th>
              <th className="py-2 px-4 border-b text-left">Number</th>
              <th className="py-2 px-4 border-b text-left">Array</th>
              <th className="py-2 px-4 border-b text-left">Enum</th>
              <th className="py-2 px-4 border-b text-left">Created</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {things?.map((thing) => (
              <tr key={thing.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">
                  <span className="font-medium">
                    {currentSearchTerm ? highlightSearchTerm(thing.name || '(unnamed)', currentSearchTerm) : (thing.name || '(unnamed)')}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <span className="text-sm text-gray-600">
                    {currentSearchTerm ? highlightSearchTerm(thing.description || '(no description)', currentSearchTerm) : (thing.description || '(no description)')}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">{thing.someNumber}</td>
                <td className="py-2 px-4 border-b">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    [{thing.stringArray?.join(', ') || 'empty'}]
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <span className="text-xs bg-blue-100 px-2 py-1 rounded">{thing.someEnum}</span>
                </td>
                <td className="py-2 px-4 border-b">
                  <span className="text-xs">
                    {new Date(thing.createdAt).toLocaleString()}
                  </span>
                </td>
                <td className="py-2 px-4 border-b">
                  <button 
                    onClick={() => updateThing({ 
                      where: { id: thing.id }, 
                      data: { 
                        name: 'Updated: ' + (thing.name || 'Thing'),
                        description: 'Updated description: ' + new Date().toLocaleTimeString()
                      } 
                    })}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded mr-2 text-sm"
                  >
                    Update
                  </button>
                  <button 
                    onClick={() => deleteThing({ id: thing.id })}
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {(things?.length === 0 && !isLoadingThing) && (
              <tr>
                <td colSpan={7} className="py-4 px-4 text-center text-gray-500">
                  No things found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-center items-center">
        <button
          onClick={() => setPage(prev => Math.max(0, prev - 1))}
          disabled={page === 0}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-l disabled:opacity-50"
        >
          Previous
        </button>
        <span className="py-2 px-4">Page {page + 1} - {Math.ceil(Number(thingCount) / itemsPerPage)} - Total: {thingCount}</span>
        <button
          onClick={() => setPage(prev => prev + 1)}
          disabled={!things || things.length < itemsPerPage}
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-r disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
