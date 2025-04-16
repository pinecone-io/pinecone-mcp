export const INDEX_CONFIG_DESCRIPTION = `The most important properties of the
index configuration are:
- "name": The name of the index.
- "embed": The configuration for the integrated embedding model. If this field
is absent, the index does not use integrated inference and is not supported by
the tools in this MCP server.
- "embed.model": The model used to embed the data.
- "embed.fieldMap.text": The name of the field in the data records that contains
the text to embed. Records in the index must contain this field.
- "vectorType": Whether the index is using a dense or sparse vector embedding.`;
