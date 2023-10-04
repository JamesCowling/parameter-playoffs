import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { ImageBox } from "./ImageBox";
import { Separator } from "@/components/ui/separator";
import { paramsToString } from "./VoteView";

function formatRating(totalVotes: number, votesFor: number) {
  if (totalVotes === 0) {
    return "unrated";
  }
  return `${votesFor} / ${totalVotes}`;
}

export function PromptInput() {
  const add = useMutation(api.prompts.add);
  const [newPrompt, setNewPrompt] = useState("");

  const addPrompt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await add({ text: newPrompt });
    setNewPrompt("");
  };

  return (
    <form onSubmit={addPrompt}>
      <label className="block text-sm font-medium leading-6 text-gray-900">
        Add new prompt
      </label>
      <div className="mt-2">
        <input
          type="text"
          name="prompt"
          id="prompt"
          required
          value={newPrompt}
          className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
          placeholder="Very hungry caterpillar, watercolor painting"
          onChange={async (e) => {
            setNewPrompt(e.target.value);
          }}
        />
      </div>
    </form>
  );
}

function PromptList() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.prompts.listWithSamples,
    {},
    { initialNumItems: 3 }
  );

  return (
    <div>
      <ul role="list" className="divide-y divide-gray-100">
        {results?.map((prompt) => (
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
                <li key={sample.url}>
                  <ImageBox
                    url={sample.url!}
                    text={paramsToString(sample.params)}
                    byline={formatRating(sample.totalVotes, sample.votesFor)}
                    onClick={() => console.log("clicked")}
                  />
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <button onClick={() => loadMore(3)} disabled={status !== "CanLoadMore"}>
        Load More
      </button>
    </div>
  );
}

export default function PromptView() {
  return (
    <>
      <PromptInput />
      <Separator />
      <PromptList />
    </>
  );
}
