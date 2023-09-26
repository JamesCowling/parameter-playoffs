import Replicate from "replicate";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Scheduler in DDIM, K_EULER, DPMSolverMultistep, K_EULER_ANCESTRAL, PNDM, KLMS
export const generate = internalAction({
  args: {
    prompt: v.string(),
    promptId: v.id("prompts"),
    scheduler: v.string(),
  },
  handler: async (ctx, { prompt, promptId, scheduler }) => {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error(
        "Add REPLICATE_API_TOKEN to your environment variables: " +
          "https://docs.convex.dev/production/environment-variables"
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    console.log(`Generating Stable-Diffusion image for prompt: ${prompt}`);
    const response = (await replicate.run(
      "stability-ai/stable-diffusion:ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4",
      {
        input: {
          prompt,
          height: 512,
          width: 512,
          scheduler: scheduler,
        },
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
      configName: scheduler,
      storageId,
    });
  },
});
