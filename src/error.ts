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

const displayPath = (path: (string | number)[]) => {
  let display = `${path[0]}`;
  for (const part of path.slice(1)) {
    if (typeof part === 'number') {
      display += `[${part}]`;
    } else if (isFieldName(part)) {
      display += `.${part}`;
    } else {
      display += `["${part}"]`;
    }
  }
  return display;
};

const formatUnionError = (issue: z.ZodInvalidUnionIssue) => {
  const invalidTypeIssues = issue.unionErrors.flatMap((e) =>
    e.issues.filter((i) => i.code === z.ZodIssueCode.invalid_type),
  );
  const expectedTypes = invalidTypeIssues.map((i) => i.expected).join(' | ');
  const receivedType = invalidTypeIssues[0].received;
  return `Expected ${expectedTypes}, received ${receivedType}`;
};

export const errorMap: z.ZodErrorMap = (issue, ctx) => {
  let message = ctx.defaultError;
  if (issue.code === z.ZodIssueCode.invalid_type) {
    message = `Expected ${issue.expected}, received ${issue.received}`;
  } else if (issue.code === z.ZodIssueCode.invalid_enum_value) {
    message = `Expected ${issue.options.map((o) => `"${o}"`).join(' | ')}`;
  } else if (issue.code === z.ZodIssueCode.unrecognized_keys) {
    message =
      `Unrecognized key${issue.keys.length === 1 ? '' : 's'}: ` +
      `${issue.keys.map((k) => `"${k}"`).join(', ')}`;
  } else if (issue.code === z.ZodIssueCode.invalid_union) {
    message = formatUnionError(issue);
  } else {
    message = ctx.defaultError;
  }
  return {message: `${displayPath(issue.path)}: ${message}`};
};
