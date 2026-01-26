# pr-merge

Check the status of the pull request.

Verify all of these conditions:
- The PR has an appropriate github label. Add a label if it doesn't have one.
- All CI checks are passing. If not, /pr-iterate
- There is no unresolved feedback. If not, /pr-iterate

If all these conditions are met, merge the PR.