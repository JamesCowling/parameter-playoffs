import Replicate from "replicate";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

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

    // We choose the same seed every time so the images look mostly the same
    // except for the scheduler differences. We could change this to a random
    // seed to make each image look different. That might make the app more fun
    // while still giving accurate results eventually, albeit with much higher
    // noise initially.
    const params = await ctx.runQuery(internal.params.getBatch, { paramIds });
    const input: {
      [key: string]: string | number;
    } = { prompt, seed: 0 };
    for (const param of params) {
      input[param.name] = param.value;
    }
    console.log(`Generating SDXL image with config ${JSON.stringify(input)}`);

    const response = (await replicate.run(
      "stability-ai/sdxl:1bfb924045802467cf8869d96b231a12e6aa994abfe37e337c63a4e49a8c6c41",
      {
        input: input,
      }
    )) as [string];
    const url = response[0];

    const imageResponse = await fetch(url).catch((e) => {
      throw new Error("error from image fetch" + e);
    });
    if (!imageResponse.ok) {
      throw new Error(`failed to download: ${imageResponse.statusText}`);
    }
    const image = await imageResponse.blob();
    const storageId = await ctx.storage.store(image);

    await ctx.runMutation(internal.samples.add, {
      prompt: promptId,
      params: paramIds,
      storageId,
    });
  },
});
