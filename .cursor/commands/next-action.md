# next-action

Find the next Linear ticket in project "SDK Maintenance" with label "tool:mcp" 
that has status "Todo" or "Backlog", prioritized by priority then creation date.

Show me the ticket title, description, and priority. Ask for confirmation before 
marking it as started.

Once confirmed, mark the ticket as started.

Review the ticket description:
- If it contains a detailed implementation plan, validate the plan against the 
  current codebase and proceed with implementation if still sensible.
- If no plan exists, draft one and get my approval before continuing.

For implementation: create a feature branch, make changes, run tests, and 
/open-pr when complete.
