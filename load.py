import os

# from dotenv import load_dotenv

from convex import ConvexClient

SOURCE = "prompts.txt"


# load_dotenv(".env.local")
# load_dotenv()

client = ConvexClient("https://superb-tiger-585.convex.cloud")
# client = ConvexClient(os.getenv("VITE_CONVEX_URL"))


def main():
    with open(SOURCE, "r") as f:
        for line in f:
            client.mutation("prompts:add", {"text": line.strip()})


main()
