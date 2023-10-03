import { useConvex, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

// Prefetch batches of this many samples.
const BATCH_SIZE = 10;

interface ImageButtonProps {
  url: string;
  subtitle: string;
  onClick: () => void;
}

// Clickable inline image.
export function ImageButton({ url, subtitle, onClick }: ImageButtonProps) {
  return (
    <div className="relative inline-block">
      <div className="group rounded-lg">
        <img
          src={url}
          className="group-hover:opacity-90 cursor-pointer"
          onClick={onClick}
        />
      </div>
      <p>{subtitle}</p>
    </div>
  );
}

// Main voting component to compare images with two different configs.
export function VoteView() {
  const convex = useConvex();

  // We maintain a batch of images and step through them to avoid latency.
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

  // Prefetching code.
  const [fetching, setFetching] = useState(false);
  async function prefetch() {
    if (fetching || batch.length - offset >= BATCH_SIZE / 2) return;
    setFetching(true);
    const newBatch = await convex.query(api.samples.getBatch, {
      size: BATCH_SIZE,
    });
    setBatch([...batch, ...newBatch]);
    setFetching(false);
    // Fetch the actual images.
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

  // Voting code.
  const vote = useMutation(api.samples.vote);
  async function handleVote(winnerId: Id<"samples">, loserId: Id<"samples">) {
    console.log(`Voting for sample ${winnerId} over sample ${loserId}`);
    await vote({ winnerId, loserId });
    setOffset(offset + 1);
  }

  const pair = batch[offset];
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

      <ImageButton
        url={pair?.left}
        subtitle={pair?.leftConfig}
        onClick={() => handleVote(pair.leftId, pair.rightId)}
      />

      <ImageButton
        url={pair?.right}
        subtitle={pair?.rightConfig}
        onClick={() => handleVote(pair.rightId, pair.leftId)}
      />
    </div>
  );
}
