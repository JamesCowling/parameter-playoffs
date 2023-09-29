import { useConvex, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { ImageBox } from "./ImageBox";

export function VoteView() {
  const convex = useConvex();
  const [batch, setBatch] = useState<
    {
      prompt: string;
      promptId: Id<"prompts">;
      left: string;
      leftId: Id<"samples">;
      leftConfig: string;
      right: string;
      rightId: Id<"samples">;
      rightConfig: string;
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
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            Pick best image for prompt
          </h1>
          <p className="mt-2 text-sm text-gray-700">{pair?.prompt}</p>
        </div>
      </div>

      <div className="mt-8">
        <ImageBox
          url={pair?.left}
          text={pair?.leftConfig}
          byline={"hello"}
          onClick={() => handleVote(pair.leftId, pair.rightId)}
        />

        <ImageBox
          url={pair?.right}
          text={pair?.rightConfig}
          byline={"hello"}
          onClick={() => handleVote(pair.rightId, pair.leftId)}
        />
      </div>
    </div>
  );
}
