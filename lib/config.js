/*!
 * Copyright (c) 2022-2025 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from '@bedrock/core';

const namespace = 'service-context-store';
const cfg = config[namespace] = {};

cfg.routes = {
  contexts: '/contexts',
  cborldRegistryEntries: '/cborld-registry-entries'
};

cfg.migration = {
  migrateContexts: true
};
