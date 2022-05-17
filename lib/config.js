/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from '@bedrock/core';

const namespace = 'service-context-store';
const cfg = config[namespace] = {};

cfg.routes = {
  contexts: '/contexts'
};

cfg.migration = {
  migrateContexts: true
};
