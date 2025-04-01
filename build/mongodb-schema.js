import { z } from 'zod';
const ScalarValue = z.union([z.string(), z.number(), z.boolean(), z.date(), z.null()]);
const ArrayValue = z.array(ScalarValue);
let QueryFilter;
const EqOperator = z
    .object({
    $eq: ScalarValue.optional().describe('The value to compare the field to'),
})
    .describe('Returns records where the field is equal to the value');
const GtOperator = z
    .object({
    $gt: ScalarValue.optional().describe('The value to compare the field to'),
})
    .describe('Returns records where the field is greater than the value');
const GteOperator = z
    .object({
    $gte: ScalarValue.optional().describe('The value to compare the field to'),
})
    .describe('Returns records where the field is greater than or equal to the value');
const InOperator = z
    .object({
    $in: ArrayValue.optional().describe('The array of values to compare the field to'),
})
    .describe('Returns records where the field is in the array of values');
const LtOperator = z
    .object({
    $lt: ScalarValue.optional().describe('The value to compare the field to'),
})
    .describe('Returns records where the field is less than the value');
const LteOperator = z
    .object({
    $lte: ScalarValue.optional().describe('The value to compare the field to'),
})
    .describe('Returns records where the field is less than or equal to the value');
const NeOperator = z
    .object({
    $ne: ScalarValue.optional().describe('The value to compare the field to'),
})
    .describe('Returns records where the field is not equal to the value');
const NinOperator = z
    .object({
    $nin: ArrayValue.optional().describe('The array of values to compare the field to'),
})
    .describe('Returns records where the field is not in the array of values');
const ExistsOperator = z
    .object({
    $exists: z.boolean().optional().describe('Returns records where the field exists'),
})
    .describe('Returns records where the field exists');
const FieldOperator = z
    .union([
    EqOperator,
    GtOperator,
    GteOperator,
    InOperator,
    LtOperator,
    LteOperator,
    NeOperator,
    NinOperator,
    ExistsOperator,
])
    .describe('Filters records based on the value of a metadata field');
const FieldFilter = z.record(z.string().describe('The metadata field to filter on'), z.union([ScalarValue, FieldOperator]).describe('The value to compare the field to')).describe('Filters records based on the value of a metadata field');
const AndOperator = z.object({
    $and: z.array(z.lazy(() => QueryFilter)).optional().describe('Returns records where all the predicates are true'),
}).describe('Returns records where all the predicates are true');
const OrOperator = z.object({
    $or: z.array(z.lazy(() => QueryFilter)).optional().describe('Returns records where at least one of the predicates are true'),
}).describe('Returns records where at least one of the predicates are true');
const LogicalOperator = z.union([AndOperator, OrOperator]).describe('A logical combination of multiple filter predicates');
// Combine all query operators
QueryFilter = z.union([FieldFilter, LogicalOperator]);
export { QueryFilter };
