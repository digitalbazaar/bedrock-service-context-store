/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import {documentStores} from '@bedrock/service-agent';

const {util: {BedrockError}} = bedrock;

/**
 * Creates a JSON-LD context document loader.
 *
 * @param {object} options - The options to use.
 * @param {object} options.config - The service object config.
 * @param {object} options.serviceType - The service type.
 *
 * @returns {Promise<Function>} The document loader.
 */
export async function createContextDocumentLoader({config, serviceType} = {}) {
  const {documentStore} = await documentStores.get({config, serviceType});

  return async function contextDocumentLoader(url) {
    const doc = await documentStore.get({id: url});
    if(doc.meta.type !== 'JsonLdContext') {
      // wrong meta type; treat as not found error
      throw new BedrockError(`Document "${url}" not found.`, 'NotFoundError', {
        url,
        httpStatusCode: 404,
        public: true
      });
    }

    return {
      contextUrl: null,
      documentUrl: url,
      document: doc.content.context
    };
  };
}
