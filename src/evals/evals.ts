//evals.ts

import { EvalConfig } from 'mcp-evals';
import { openai } from "@ai-sdk/openai";
import { grade, EvalFunction } from "mcp-evals";

const searchRecordsEval: EvalFunction = {
    name: "search-records Tool Evaluation",
    description: "Evaluates the search-records tool",
    run: async () => {
        const result = await grade(openai("gpt-4"), "Could you search for records of 'Jane Doe' in the 'userAccounts' namespace and re-rank them by relevance?");
        return JSON.parse(result);
    }
};

const createIndexForModelEval: EvalFunction = {
    name: 'createIndexForModelEval',
    description: 'Evaluates the functionality of creating an index for a model',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please create an index named 'eval-test-index' for an embedding model using cloud AWS?");
        return JSON.parse(result);
    }
};

const listIndexesEval: EvalFunction = {
    name: 'list-indexes Tool Evaluation',
    description: 'Evaluates the tool that lists indexes from the database',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please list all indexes in the database.");
        return JSON.parse(result);
    }
};

const describeIndexStatsEval: EvalFunction = {
    name: 'describe-index-stats Evaluation',
    description: 'Evaluates the functionality of describing index stats by name',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Describe the stats for the index named 'testIndex'");
        return JSON.parse(result);
    }
};

const upsertRecordsEval: EvalFunction = {
    name: 'UpsertRecords Tool Evaluation',
    description: 'Tests the upsert-records tool for adding and updating records in a data store',
    run: async () => {
        const result = await grade(openai("gpt-4"), "Please upsert the following records in the 'myNamespace' namespace of 'myIndex': {\"records\":[{\"id\":1,\"value\":\"TestRecord\"},{\"id\":2,\"value\":\"AnotherRecord\"}]}");
        return JSON.parse(result);
    }
};

const config: EvalConfig = {
    model: openai("gpt-4"),
    evals: [searchRecordsEval, createIndexForModelEval, listIndexesEval, describeIndexStatsEval, upsertRecordsEval]
};
  
export default config;
  
export const evals = [searchRecordsEval, createIndexForModelEval, listIndexesEval, describeIndexStatsEval, upsertRecordsEval];