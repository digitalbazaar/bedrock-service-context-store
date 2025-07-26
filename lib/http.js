/*!
 * Copyright (c) 2018-2025 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import {
  createCborldRegistryEntryBody, createContextBody,
  updateCborldRegistryEntryBody, updateContextBody
} from '../schemas/bedrock-service-context-store.js';
import {addDocumentRoutes} from '@bedrock/service-agent';

export async function addCborldRoutes({app, service} = {}) {
  const cfg = bedrock.config['service-context-store'];
  const basePath = cfg.routes.cborldRegistryEntries;
  addDocumentRoutes({
    app, service,
    type: 'CborLdRegistryEntry',
    typeName: 'CBOR-LD registry entry',
    contentProperty: 'registryEntry',
    basePath,
    pathParam: 'registryEntryId',
    createBodySchema: createCborldRegistryEntryBody,
    updateBodySchema: updateCborldRegistryEntryBody
  });
}

export async function addContextRoutes({app, service} = {}) {
  const cfg = bedrock.config['service-context-store'];
  const basePath = cfg.routes.contexts;
  addDocumentRoutes({
    app, service,
    type: 'JsonLdContext',
    typeName: 'JSON-LD context',
    contentProperty: 'context',
    basePath,
    pathParam: 'contextId',
    createBodySchema: createContextBody,
    updateBodySchema: updateContextBody
  });
}
