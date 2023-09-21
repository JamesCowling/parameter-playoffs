import { useConvex, useMutation } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

function getOffset(n: number) {
  let offset = 0;
  for (let i = 0; i < n; i++) {
    offset += 6 / (i + 1);
  }
  return offset;
}

function ImageStack({
  onClick,
  images,
  left,
}: {
  onClick: any;
  images: string[];
  left: boolean;
}) {
  const [isPressed, setIsPressed] = useState(false);

  const handleMouseDown = () => {
    setIsPressed(true);
  };

  const handleMouseUp = () => {
    setIsPressed(false);
  };

  const handleMouseLeave = () => {
    setIsPressed(false);
  };

  const handleClick = (e: any) => {
    if (onClick) {
      onClick(e);
    }
  };

  let mirror = -1;
  if (left) mirror = 1;

  return (
    <button
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative m-8"
    >
      <div className="h-512 w-512"></div>
      {images.map((url, index) => (
        <img
          key={url}
          style={{
            marginLeft: `${mirror * getOffset(index)}px`,
            marginTop: `${getOffset(index)}px`,
            transform: `rotate(${mirror * index * -0.2}deg)`,
            filter: `brightness(${100 - index * 5}%)`,
            zIndex: -10 * index,
          }}
          className={`absolute rounded-xl border-gray-900 shadow-md top-0 left-0 w-512 h-512 transform ${
            isPressed ? "translate-x-px translate-y-px" : ""
          } transition-transform duration-75`}
          src={url}
        />
      ))}
      {isPressed && <div className="absolute top-50 left-0">Dall-E</div>}
    </button>
  );
}

export function VoteView() {
  const convex = useConvex();
  const [batch, setBatch] = useState<
    {
      prompt: string;
      promptId: Id<"prompts">;
      left: string;
      leftId: Id<"samples">;
      leftModel: string;
      right: string;
      rightId: Id<"samples">;
      rightModel: string;
    }[]
  >([]);
  const [offset, setOffset] = useState(0);
  const [fetching, setFetching] = useState(false);
  const [lastWinner, setLastWinner] = useState("");

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

  const stack = batch.slice(offset, offset + 10);
  const pair = stack[0];

  useEffect(() => {
    if (offset >= batch.length) return;
    const leftId = batch[offset].leftId;
    const rightId = batch[offset].rightId;
    const leftModel = batch[offset].leftModel;
    const rightModel = batch[offset].rightModel;
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        handleVote(leftId, rightId, leftModel);
      } else if (event.key === "ArrowRight") {
        handleVote(rightId, leftId, rightModel);
      }
    };
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [offset]);

  const vote = useMutation(api.samples.vote);
  async function handleVote(
    winnerId: Id<"samples">,
    loserId: Id<"samples">,
    winningModel: string
  ) {
    console.log(`voting with winnerId ${winnerId} and loserId ${loserId}`);
    await vote({ winnerId, loserId });
    setLastWinner(winningModel);
    setOffset(offset + 1);
  }

  return (
    <div className="text-gray-900">
      <h1 className="text-4xl font-bold tracking-tight mx-8 mt-12 mb-8">
        Hot or Bot?
      </h1>
      <h2 className="leading-7 text-3xl font-bold mx-8">
        Prompt: <span className="text-sky-700">{pair?.prompt}</span>
      </h2>

      <ImageStack
        onClick={() => handleVote(pair.leftId, pair.rightId, pair.leftModel)}
        images={stack.map((prompt) => prompt.left)}
        left={true}
      />

      <ImageStack
        onClick={() => handleVote(pair.rightId, pair.leftId, pair.rightModel)}
        images={stack.map((prompt) => prompt.right)}
        left={false}
      />
      <p className="mx-8 mt-2 text-xl">
        Click to vote or use left/right arrows.
      </p>
    </div>
  );
}
