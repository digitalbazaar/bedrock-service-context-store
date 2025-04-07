/*!
 * Copyright (c) 2024-2025 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import {documentStores} from '@bedrock/service-agent';

export const CBORLD_REGISTRY_ENTRY_URN_PREFIX = 'urn:cborld:registry-entry:';

const {util: {BedrockError}} = bedrock;

/**
 * Creates a CBOR-LD type table loader.
 *
 * @param {object} options - The options to use.
 * @param {object} options.config - The service object config.
 * @param {object} options.serviceType - The service type.
 *
 * @returns {Promise<Function>} The type table loader.
 */
export async function createTypeTableLoader({config, serviceType} = {}) {
  const {documentStore} = await documentStores.get({config, serviceType});

  return async function typeTableLoader({registryEntryId} = {}) {
    const id = `${CBORLD_REGISTRY_ENTRY_URN_PREFIX}${registryEntryId}`;
    const doc = await documentStore.get({id});
    if(doc.meta.type !== 'CborLdRegistryEntry') {
      // wrong meta type; treat as not found error
      throw new BedrockError(
        `CBOR-LD registry entry "${registryEntryId}" not found.`, {
          name: 'NotFoundError',
          details: {
            registryEntryId,
            httpStatusCode: 404,
            public: true
          }
        });
    }

    // create type table map from registry entry array or object
    const {content: {registryEntry}} = doc;
    if(Array.isArray(registryEntry)) {
      /* Each element:
      {
        // table type
        "type": "context",
        // type table
        "table": {
          "https://www.w3.org/ns/credentials/v2": 1
        }
      }
      */
      return new Map(registryEntry.map(
        e => [e.type, new Map(Object.entries(e.table))]));
    }

    // registry entry must be an object:
    /*
    {
      "context": {
        // type table
        "https://www.w3.org/ns/credentials/v2": 1
      }
    }
    */
    return new Map([...Object.entries(registryEntry)].map(
      ([type, typeTable]) => [type, new Map(Object.entries(typeTable))]));
  };
}
