/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {addRoutes} from './http.js';
import {createContextDocumentLoader} from './documentLoaders.js';

// load config defaults
import './config.js';

// include migration scripts
import './migrate.js';

export {addRoutes, createContextDocumentLoader};
