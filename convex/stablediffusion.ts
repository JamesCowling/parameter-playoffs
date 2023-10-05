import Replicate from "replicate";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const MODEL =
  "stability-ai/sdxl:1bfb924045802467cf8869d96b231a12e6aa994abfe37e337c63a4e49a8c6c41";

type SDXLConfig = {
  prompt: string;
  seed: number;
  [key: string]: string | number;
};

export const generate = internalAction({
  args: {
    prompt: v.string(),
    promptId: v.id("prompts"),
    paramIds: v.array(v.id("params")),
  },
  handler: async (ctx, { prompt, promptId, paramIds }) => {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error(
        "Add REPLICATE_API_TOKEN to your environment variables: " +
          "https://docs.convex.dev/production/environment-variables"
      );
    }
    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    // Fetch params and build SDXL config.
    const params = await ctx.runQuery(internal.params.getForIds, {
      ids: paramIds,
    });
    const input = params.reduce(
      (acc, param) => {
        acc[param.name] = param.value;
        return acc;
      },
      { prompt, seed: 0 } as SDXLConfig
    );

    console.log(`Generating SDXL image with config ${JSON.stringify(input)}`);
    const [url] = (await replicate.run(MODEL, { input })) as [string];
    const imageResponse = await fetch(url).catch((e) => {
      throw new Error("error from image fetch" + e);
    });
    if (!imageResponse.ok) {
      throw new Error(`failed to download: ${imageResponse.statusText}`);
    }

    const storageId = await ctx.storage.store(await imageResponse.blob());

    // Note that if the action fails at this point the image will be stored in
    // Convex without any sample pointing to it.

    await ctx.runMutation(internal.samples.add, {
      prompt: promptId,
      params: paramIds,
      storageId,
    });
  },
});
