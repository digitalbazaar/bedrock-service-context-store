/*!
 * Copyright (c) 2021-2025 Digital Bazaar, Inc. All rights reserved.
 */
import {addCborldRoutes, addContextRoutes} from './http.js';
import {
  CBORLD_REGISTRY_ENTRY_URN_PREFIX, createTypeTableLoader
} from './typeTableLoaders.js';
import {createContextDocumentLoader} from './documentLoaders.js';

// load config defaults
import './config.js';

// include migration scripts
import './migrate.js';

export {
  addCborldRoutes,
  // backwards compatibility
  addContextRoutes as addRoutes,
  addContextRoutes,
  createContextDocumentLoader,
  createTypeTableLoader as createCborldTypeTableLoader,
  CBORLD_REGISTRY_ENTRY_URN_PREFIX
};
