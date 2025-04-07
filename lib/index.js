/*!
 * Copyright (c) 2021-2025 Digital Bazaar, Inc. All rights reserved.
 */
import {addContextRoutes} from './http.js';
import {createContextDocumentLoader} from './documentLoaders.js';

// load config defaults
import './config.js';

// include migration scripts
import './migrate.js';

export {
  // backwards compatibility
  addContextRoutes as addRoutes,
  addContextRoutes,
  createContextDocumentLoader
};
