"use client";
import { create } from "domain";

import { useEffect, useState, useMemo } from "react";
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
  }, [arrayFilterExample, arrayOperator, enumFilter, useOrLogic, nameFilter, numberFilter]);
  
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
    where: {
      someEnum: "ONE",
      name: "New Thing"
    },
    orderBy: {
      [sortField]: sortDirection
    },
  });

  // things?.[0]?.someJson;

  // useEffect(() => {
  //   if(thingCount) {
  //     thingCount().then((count) => {
  //       setThingsCount(count);
  //     });
  //   }
  // }, []);

  if(thingError) {
    return <div>Error: {thingError.message}</div>;
  }

  // if(isLoadingThing) {
  //   return <div>Loading...</div>;
  // }

  // console.log(searchThings.queries);
  
  console.log(`loading value: ${isLoadingThing}`);

  return (
    <div className="container mx-auto p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Suparisma Things</h1>
        <input type="text" placeholder="Search" onChange={(e) => {
          const searchValue = e.target.value;
          console.log(`searchValue: ${searchValue}`);
        
              searchThings.setQueries([{
                field: "name",
                value: searchValue?.trim(),
              }]);
        }} />
        <button 
          onClick={() => createThing({ name: 'New Thing', someNumber: Math.floor(Math.random() * 100), stringArray: ['1', '2', '3'] })}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create New Thing {isLoadingThing ? "..." : ""}
        </button>
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
              <th className="py-2 px-4 border-b text-left">Some Number</th>
              <th className="py-2 px-4 border-b text-left">String Array</th>
              <th className="py-2 px-4 border-b text-left">Enum</th>
              <th className="py-2 px-4 border-b text-left">ID</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {things?.map((thing) => (
              <tr key={thing.id} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{thing.name}</td>
                <td className="py-2 px-4 border-b">{thing.someNumber}</td>
                <td className="py-2 px-4 border-b">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    [{thing.stringArray?.join(', ') || 'empty'}]
                  </span>
                </td>
                <td className="py-2 px-4 border-b">{thing.someEnum}</td>
                <td className="py-2 px-4 border-b">{thing.id}</td>
                <td className="py-2 px-4 border-b">
                  <button 
                    onClick={() => updateThing({ where: { id: thing.id }, data: { name: 'Updated Thing Name' } })}
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
                <td colSpan={6} className="py-4 px-4 text-center text-gray-500">
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
