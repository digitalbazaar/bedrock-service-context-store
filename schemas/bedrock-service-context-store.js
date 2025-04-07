/*!
 * Copyright (c) 2022-2025 Digital Bazaar, Inc. All rights reserved.
 */
const sequence = {
  title: 'sequence',
  type: 'integer',
  minimum: 0,
  maximum: Number.MAX_SAFE_INTEGER - 1
};

const cborldTypeTable = {
  title: 'CBOR-LD Type Table',
  type: 'object',
  additionalProperties: false,
  patternProperties: {
    '^.*$': {
      type: 'number'
    }
  }
};

export const cborLdRegistryEntryBody = {
  title: 'CBOR-LD Registry Entry Record',
  type: 'object',
  required: ['id', 'registryEntry'],
  additionalProperties: false,
  properties: {
    id: {
      title: 'Registry Entry ID',
      type: 'string',
      pattern: '^urn:cborld:registry-entry:[0-9]+$'
    },
    registryEntry: {
      oneOf: [{
        /* Array formatted registry entry, e.g.:
        [{
          // table type
          "type": "context",
          // type table
          "table": {
            "https://www.w3.org/ns/credentials/v2": 1
          }
        }, {
          "type": "url",
          "table": {
            "https://foo.example": 1
          }
        }, {
          "type": "https://w3id.org/security#cryptosuiteString",
          "table": {
            "ecdsa-rdfc-2019": 1
          }
        }]
        */
        type: 'array',
        items: {
          type: 'object',
          properties: {
            type: {
              type: 'string'
            },
            table: cborldTypeTable
          }
        }
      }, {
        /* Object formatted registry entry, e.g.:
        {
          // table type, e.g., "context", "https://foo.example/bar#baz", "url"
          "context": {
            // type table
            "https://www.w3.org/ns/credentials/v2": 1
          },
          "url": {
            "https://foo.example": 1
          },
          "https://w3id.org/security#cryptosuiteString": {
            "ecdsa-rdfc-2019": 1
          }
        }
        */
        type: 'object',
        additionalProperties: false,
        patternProperties: {
          '^.*$': cborldTypeTable
        }
      }]
    }
  }
};
export const createCborLdRegistryEntryBody = {
  ...cborLdRegistryEntryBody,
  title: 'createCborLdRegistryEntryBody'
};
export const updateCborLdRegistryEntryBody = {
  ...cborLdRegistryEntryBody,
  required: ['id', 'registryEntry', 'sequence'],
  properties: {
    ...cborLdRegistryEntryBody.properties,
    sequence
  },
  title: 'updateCborLdRegistryEntryBody'
};

export const contextBody = {
  title: 'JSON-LD Context Record',
  type: 'object',
  required: ['id', 'context'],
  additionalProperties: false,
  properties: {
    id: {
      title: 'Context ID',
      type: 'string'
    },
    context: {
      type: 'object',
      additionalProperties: true,
      required: ['@context'],
      properties: {
        '@context': {
          title: '@context',
          anyOf: [{
            type: 'string'
          }, {
            type: 'object'
          }, {
            type: 'array',
            minItems: 1,
            items: {
              type: ['string', 'object']
            }
          }]
        }
      }
    }
  }
};
export const createContextBody = {
  ...contextBody,
  title: 'createContextBody'
};
export const updateContextBody = {
  ...contextBody,
  required: ['id', 'context', 'sequence'],
  properties: {
    ...contextBody.properties,
    sequence
  },
  title: 'updateContextBody'
};
