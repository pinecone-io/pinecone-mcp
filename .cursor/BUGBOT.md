# Code Review Guidance

## Quick Reference

Verify: code compiles, tests pass, JavaDoc updated, no generated code edits, proper exception handling, input validation, adequate test coverage.

## Code Quality Review

### Documentation
- Update JavaDoc near changed code. Include `@throws` for all exceptions. Use `<pre>{@code ... }</pre>` for public API examples. Document parameter constraints and validation rules. JavaDoc must describe actual behavior, not intended behavior.
- All public methods/classes/interfaces need complete JavaDoc. Provide examples for complex APIs. Document parameters and return values clearly.

### Exception Handling
- Use custom exceptions from `io.pinecone.exceptions`: `PineconeValidationException` for invalid inputs, `PineconeBadRequestException` for bad requests. Avoid generic exceptions.
- Error messages must be descriptive, actionable, and reference docs when appropriate. When wrapping exceptions, preserve cause: `new Exception(message, cause)`.
- Map HTTP status codes to exceptions using `HttpErrorMapper` patterns. Ensure consistent error handling.

### Validation
- Validate inputs early in public methods. Throw `PineconeValidationException` with clear messages. Use static validation methods (e.g., `validatePodIndexParams`) for reusable logic. Explicitly check null and empty strings.
- Handle edge cases (null, empty, max values) with appropriate error messages.

### Code Generation
- Never edit `org.openapitools.*` files directly. Update source OpenAPI/Proto files in `codegen/` and regenerate. Verify regeneration results.

### Testing
- Capture all major requirements as tests. Unit tests cover validation and error paths. Integration tests cover end-to-end workflows (sparingly). Test success and failure scenarios including edge cases. Use descriptive test method names.
- Tests must be readable, maintainable, follow coding standards, avoid unnecessary complexity, use mocks appropriately.

### Thread Safety
- Identify shared mutable state (e.g., `ConcurrentHashMap` for connections). Document thread-safety guarantees in JavaDoc. Use thread-safe collections for shared data. Verify concurrent access is safe.

### Resource Management
- Reuse `OkHttpClient` instances. Document resource lifecycle in JavaDoc. Ensure cleanup in error scenarios. Verify no resource leaks in normal and error paths.

### Code Style
- Code must be readable, follow Java idioms, prefer clarity over cleverness. Use descriptive names. Break up files over 800 lines. Classes should have single responsibility.
- Avoid breaking public interfaces. If unavoidable, provide migration path and deprecation strategy. Document breaking changes in PR description.

## Pull Request Review

### PR Title and Description
- Title: Use Conventional Commits 1.0.0 format (e.g., `fix: handle null pointer exception in query method`). Clearly describe PR purpose.
- Description: Problem and solution, GitHub/Linear issue references, usage examples, value summary (concise), relevant links.

### Code Changes
- Scope: Single concern per PR. Focused changes. Separate unrelated changes.
- Backward compatibility: Maintain when possible. Document and justify breaking changes. Add deprecation warnings for removed functionality.
- Dependencies: No unnecessary additions. Justify and document new dependencies. Ensure version compatibility.

## Common Issues

- Missing null checks (especially public APIs)
- Incomplete error handling
- Missing tests for new functionality
- Outdated JavaDoc
- Resource leaks (use try-with-resources, not manual close())
- Thread safety violations
- Breaking changes without notice
- Editing generated code directly
- String comparison with `==` (use `.equals()`)
- Exception swallowing (log or rethrow, avoid empty catch blocks)
- Incorrect `equals()/hashCode()` (implement together, critical for collections)
- Collection modification during iteration (use `iterator.remove()` or collect first)
- Mutable objects as map keys (ensure immutability or proper `hashCode()`)
- String concatenation in loops (use `StringBuilder`, not `+`)
- Raw types instead of generics (use `List<String>`, not `List`)
- Incorrect Optional usage (don't use for null checks when null is valid; don't use as method parameters)
- Not preserving exception cause (use `new Exception(message, cause)`)
- Date/time API misuse (use `java.time.*`, not `java.util.Date`/`Calendar`)
- Boxing/unboxing overhead (prefer primitives in performance-critical code)
- Incorrect synchronization (avoid synchronizing on non-final objects or String literals)
- Memory leaks with listeners (remove listeners/callbacks/observers)
- Not validating collection contents (validate elements, not just reference)
- Object comparison with `==` (use `.equals()`)
- Ignoring checked exceptions (handle or rethrow, avoid `catch (Exception e) { /* ignore */ }`)

## Review Focus by Change Type

**Bug Fixes**: Address root cause, not symptoms. No regressions. Handle related edge cases. Tests demonstrate fix.

**New Features**: Complete and functional. Well-designed public API with documentation. Tests cover happy path and errors. No breaking changes unless intentional.

**Refactoring**: Behavior unchanged (verify with tests). More maintainable/readable. No performance regressions. Update docs if needed.

**Performance Improvements**: Measurable and significant. No correctness regressions. Tests verify improvement. Document trade-offs.
