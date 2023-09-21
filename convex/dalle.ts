import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import OpenAI from "openai";

export const generate = internalAction({
  args: { prompt: v.string(), promptId: v.id("prompts") },
  handler: async (ctx, { prompt, promptId }) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "Add OPENAI_API_KEY to your environment variables: " +
          "https://docs.convex.dev/production/environment-variables"
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Generating DALL-E image for prompt: ${prompt}`);
    const response = await openai.images
      .generate({
        prompt,
        n: 1,
        size: "512x512",
      })
      .catch((e) => {
        throw new Error("error from DALL-E" + e);
      });

    const url = response.data.at(0)?.url;
    if (url === undefined) {
      throw new Error("error from DALL-E");
    }

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
      modelName: "DALL-E",
      storageId,
    });
  },
});
