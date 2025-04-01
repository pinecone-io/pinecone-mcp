from agents import Agent, Runner, gen_trace_id, trace
from agents.mcp import MCPServer, MCPServerStdio
import asyncio, os, shutil

async def run(mcp_server1: MCPServer, mcp_server2: MCPServer):
    agent = Agent(
        name="Assistant",
        instructions="You respond to questions about movies. The user will ask a question that you need to understand and appropriately parse, retrieve data from Pinecone, and appropriately synthesize. You have access to a Pinecone index called 'movies'. You can use describe-index-stats to list namespaces that might contain relevant data. The index stores movies in the following format: summary | title | year | box-office | genre. If you get too many results, you can use the following fields to filter the results: title, year, box-office, genre, with the following operators: $eq, $lt, $lte, $gt, $gte, $in, $nin, $and, $or, $exists. Try not to be too restrictive in your metadata filtering. Only use the filter if the user specifically asks for a specific year, genre, or box-office range. If you don't get any results, your metadata filter is too restrictive. Try again with a less restrictive filter.",
        mcp_servers=[mcp_server1, mcp_server2]
    )

    result = await Runner.run(agent, "Movies about space exploration")
    print(result.final_output)

    result = await Runner.run(agent, "Kids movies with animals released between 2000 and 2012")
    print(result.final_output)

async def main():
    async with MCPServerStdio(
        name="Pinecone MCP",
        params={
            "command": "node",
            "args": ["/Users/jake.f/pinecone/pinecone-mcp/build/index.js"],
            "env": {
                "PINECONE_API_KEY": "pcsk_4KqR7D_5ioEoQZ1yhr9dcFdqe6Tgx7bkP4PZaM7cZUcg2hsikc1C4GtxEsh8DRNNWGZaXT"
            }
        }
    ) as server1, MCPServerStdio(
        name="Pinecone Docs",
        params={
            "command": "node",
            "args": ["/Users/jake.f/.mcp/pinecone-2/src/index.js"]
        }
    ) as server2:
        trace_id = gen_trace_id()
        with trace(workflow_name="Pinecone MCP Example", trace_id=trace_id):
            print(f"View trace: https://platform.openai.com/traces/trace?trace_id={trace_id}\n")
            await run(server1, server2)

if __name__ == "__main__":
    asyncio.run(main())