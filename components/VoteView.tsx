import { useConvex, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useEffect, useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export function VoteView() {
  const convex = useConvex();
  const [batch, setBatch] = useState<
    {
      prompt: string;
      promptId: Id<"prompts">;
      left: string;
      leftId: Id<"samples">;
      right: string;
      rightId: Id<"samples">;
    }[]
  >([]);
  const [offset, setOffset] = useState(0);
  const [fetching, setFetching] = useState(false);

  // Prefectching.
  async function prefetch() {
    if (fetching || batch.length > offset + 5) return;
    console.log(
      `prefetching with offset ${offset} and batch length ${batch.length}`
    );
    setFetching(true);
    const newBatch = await convex.query(api.samples.getBatch);
    const extendedBatch = [...batch, ...newBatch];
    console.log(`extended batch length: ${extendedBatch.length}`);
    setBatch(extendedBatch);
    setFetching(false);
    for (let i = 0; i < newBatch.length; i++) {
      const leftImage = new Image();
      leftImage.src = newBatch[i].left;
      const rightImage = new Image();
      rightImage.src = newBatch[i].right;
    }
  }
  useEffect(() => {
    prefetch();
  }, [offset]);

  const pair = batch[offset];

  useEffect(() => {
    if (offset >= batch.length) return;
    const leftId = batch[offset].leftId;
    const rightId = batch[offset].rightId;
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handleVote(leftId, rightId);
      } else if (event.key === "ArrowRight") {
        handleVote(rightId, leftId);
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [offset]);

  const vote = useMutation(api.samples.vote);
  async function handleVote(winnerId: Id<"samples">, loserId: Id<"samples">) {
    console.log(`voting with winnerId ${winnerId} and loserId ${loserId}`);
    await vote({ winnerId, loserId });
    setOffset(offset + 1);
  }

  return (
    <div>
      <p>Click to vote or use left/right arrows.</p>
      <h2>{pair?.prompt}</h2>
      <button onClick={() => handleVote(pair.leftId, pair.rightId)}>
        <img src={pair?.left} />
      </button>
      <button onClick={() => handleVote(pair.rightId, pair.leftId)}>
        <img src={pair?.right} />
      </button>
    </div>
  );
}
