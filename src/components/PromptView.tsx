import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

export function PromptView() {
  const prompts = useQuery(api.prompts.list);
  const add = useMutation(api.prompts.add);
  const [newPrompt, setNewPrompt] = useState("");

  const addPrompt = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await add({ text: newPrompt });
    setNewPrompt("");
  };

  return (
    <div>
      <h3>Prompts</h3>
      {prompts?.map(({ _id, text }) => (
        <div key={_id}>{text}</div>
      ))}
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
    </div>
  );
}
