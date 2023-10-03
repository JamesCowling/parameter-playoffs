import Replicate from "replicate";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Scheduler in DDIM, DPMSolverMultistep, HeunDiscrete, KarrasDPM, K_EULER_ANCESTRAL, K_EULER, PNDM
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

    // We choose the same seed every time so the images look mostly the same
    // except for the scheduler differences. We could change this to a random
    // seed to make each image look different. That might make the app more fun
    // while still giving accurate results eventually, albeit with much higher
    // noise initially.
    console.log(`Generating Stable-Diffusion image for prompt: ${prompt}`);
    const response = (await replicate.run(
      "stability-ai/sdxl:1bfb924045802467cf8869d96b231a12e6aa994abfe37e337c63a4e49a8c6c41",
      {
        input: {
          prompt,
          scheduler: scheduler,
          seed: 0, // Same seed every time to keep images similar.
          refine: "base_image_refiner",
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
