"use client";
import { create } from "domain";

import { useEffect, useState } from "react";
import useSuparisma from "../generated";

export default function Home() {

  const itemsPerPage = 10;
  const [page, setPage] = useState(0);
  
  // Add state for filtering and sorting
  const [enumFilter, setEnumFilter] = useState("");
  const [sortField, setSortField] = useState("updatedAt");
  const [sortDirection, setSortDirection] = useState("desc");

  // const [thingsCount, setThingsCount] = useState(0);
  const { 
    data: things,
    loading: isLoadingThing,
    error: thingError,
    create: createThing,
    update: updateThing,
    delete: deleteThing,
    count: thingCount,
  } = useSuparisma.thing({
    realtime: true,
    limit: itemsPerPage,
    offset: page * itemsPerPage,
    where: enumFilter ? {
      someEnum: enumFilter
    } : undefined,
    orderBy: {
      [sortField]: sortDirection
    }
  });

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

  return (
    <div className="container mx-auto p-4 font-[family-name:var(--font-geist-sans)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Suparisma Things</h1>
        <button 
          onClick={() => createThing({ name: 'New Thing', someNumber: Math.floor(Math.random() * 100) })}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Create New Thing {isLoadingThing ? "..." : ""}
        </button>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="enumFilter" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Enum
          </label>
          <select
            id="enumFilter"
            value={enumFilter}
            onChange={(e) => {
              setEnumFilter(e.target.value);
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
                <td colSpan={5} className="py-4 px-4 text-center text-gray-500">
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
