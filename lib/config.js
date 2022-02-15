/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import bedrock from 'bedrock';
const {config} = bedrock;

const namespace = 'service-context-store';
const cfg = config[namespace] = {};

cfg.routes = {
  contexts: '/contexts'
};
