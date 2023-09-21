"use node";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { internalAction } from "./_generated/server";
import OpenAI from "openai";

// Generates an image for the prompt, stores it, returns the storageId.
export const generateImage = internalAction({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    console.log(`Generating DALL-E image for prompt: ${prompt}`);
    const dalleResponse = await openai.images
      .generate({
        prompt,
        n: 1,
        size: "512x512",
      })
      .catch((e) => {
        throw new Error("error from DALL-E" + e);
      });

    const url = dalleResponse.data.at(0)?.url;
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
    return await ctx.storage.store(image);
  },
});

export const addSample = internalAction({
  args: { prompt: v.string(), promptId: v.id("prompts") },
  handler: async (ctx, { prompt, promptId }) => {
    const storageId = await generateImage(ctx, { prompt });
    await ctx.runMutation(internal.samples.addSample, {
      prompt: promptId,
      modelName: "DALL-E",
      storageId,
    });
  },
});
