/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import bedrock from 'bedrock';
const {config} = bedrock;

const namespace = 'service-agent';
const cfg = config[namespace] = {};

cfg.routes = {
  contexts: '/contexts'
};
