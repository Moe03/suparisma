"use client";
import { create } from "domain";
import useSuparisma from "../../generated";

export default function Home() {
  const { 
    data: things,
    loading: isLoadingThing,
    error: thingError,
    create: createThing,
    update: updateThing,
    delete: deleteThing,
  } = useSuparisma.thing({
    realtime: true
  });

  if(thingError) {
    return <div>Error: {thingError.message}</div>;
  }

  if(isLoadingThing) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1>Suparisma Thing</h1>
      <p>Thing: {things?.[0]?.name}</p>
      <button onClick={() => createThing({ name: 'New Thing', someNumber: Math.floor(Math.random() * 100) })}>Create new thing</button>
      {things?.map((thing) => (
        <div key={thing.id}>
          <p>{thing.name} - {thing.someNumber} - {thing.id}</p>
          <button onClick={() => updateThing({ where: { id: thing.id }, data: { name: 'Updated Thing' } })}>Update thing</button>
          <button onClick={() => deleteThing({ id: thing.id })}>Delete thing</button>
        </div>
      ))}
    </div>
  );
}
