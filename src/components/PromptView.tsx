import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

function formatRating(totalVotes: number, votesFor: number) {
  if (totalVotes === 0) {
    return "unrated";
  }
  return `${votesFor} / ${totalVotes}`;
}

// XXX this will take forever to load, should make it paginated
export default function PromptView() {
  const prompts = useQuery(api.prompts.listWithSamples);
  const add = useMutation(api.prompts.add);
  const [newPrompt, setNewPrompt] = useState("");

  const addPrompt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await add({ text: newPrompt });
    setNewPrompt("");
  };

  return (
    <div>
      <form onSubmit={addPrompt}>
        <input
          type="text"
          required
          value={newPrompt}
          onChange={async (e) => {
            setNewPrompt(e.target.value);
          }}
          placeholder="or add a new"
        />
        <button type="submit" disabled={!newPrompt}>
          Add
        </button>
      </form>
      <ul role="list" className="divide-y divide-gray-100">
        {prompts?.map((prompt) => (
          <li key={prompt._id} className="flex justify-between gap-x-6 py-5">
            <div className="flex min-w-0 gap-x-4">
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">
                  {prompt.text}
                </p>
                <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                  Created {prompt._creationTime}
                </p>
              </div>
            </div>

            <ul
              role="list"
              className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8"
            >
              {prompt.samples?.map((sample) => (
                <li key={sample.url} className="relative">
                  <div className="group block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
                    <img
                      src={sample.url!}
                      alt=""
                      className="pointer-events-none object-cover group-hover:opacity-75"
                    />
                    <button
                      type="button"
                      className="absolute inset-0 focus:outline-none"
                    >
                      <span className="sr-only">
                        View details for {sample.configName}
                      </span>
                    </button>
                  </div>
                  <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-gray-900">
                    {sample.configName}
                  </p>
                  <p className="pointer-events-none block text-sm font-medium text-gray-500">
                    {formatRating(sample.totalVotes, sample.votesFor)}
                  </p>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
