import {z} from 'zod';

const FIELD_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$';
const FIELD_START_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$';

const isFieldName = (name: string) => {
  if (name.length === 0) {
    return false;
  }
  return (
    FIELD_START_CHARS.includes(name[0]) && [...name].every((c: string) => FIELD_CHARS.includes(c))
  );
};

const displayPath = (path: PropertyKey[] | undefined) => {
  if (!path || path.length === 0) {
    return '(root)';
  }
  let display = `${String(path[0])}`;
  for (const part of path.slice(1)) {
    if (typeof part === 'number') {
      display += `[${part}]`;
    } else if (typeof part === 'string' && isFieldName(part)) {
      display += `.${part}`;
    } else {
      display += `["${String(part)}"]`;
    }
  }
  return display;
};

const getTypeName = (value: unknown): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
};

const formatUnionError = (errors: z.core.$ZodIssue[][], input: unknown) => {
  // In Zod v4, errors is an array of arrays of issues
  const allIssues = errors.flat();
  const invalidTypeIssues = allIssues.filter(
    (i): i is z.core.$ZodIssueInvalidType => i.code === 'invalid_type',
  );
  if (invalidTypeIssues.length === 0) {
    return 'Invalid union value';
  }
  const expectedTypes = invalidTypeIssues.map((i) => i.expected).join(' | ');
  const receivedType = getTypeName(input);
  return `Expected ${expectedTypes}, received ${receivedType}`;
};

export const errorMap: z.core.$ZodErrorMap = (issue) => {
  let message: string | undefined;
  if (issue.code === 'invalid_type') {
    const received = issue.received ?? getTypeName(issue.input);
    message = `Expected ${issue.expected}, received ${received}`;
  } else if (issue.code === 'invalid_value') {
    const values = issue.values as unknown[];
    message = `Expected ${values.map((o) => `"${o}"`).join(' | ')}`;
  } else if (issue.code === 'unrecognized_keys') {
    const keys = issue.keys ?? [];
    message =
      `Unrecognized key${keys.length === 1 ? '' : 's'}: ` +
      `${keys.map((k) => `"${k}"`).join(', ')}`;
  } else if (issue.code === 'invalid_union') {
    message = formatUnionError(issue.errors, issue.input);
  } else {
    message = issue.message;
  }

  if (!message) {
    return undefined; // Let Zod use the default message
  }
  return `${displayPath(issue.path)}: ${message}`;
};
