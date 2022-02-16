/*!
 * Copyright (c) 2018-2022 Digital Bazaar, Inc. All rights reserved.
 */
import bedrock from 'bedrock';
import {asyncHandler} from 'bedrock-express';
import cors from 'cors';
import {
  createContextBody, updateContextBody
} from '../schemas/bedrock-service-context-store.js';
import {metering, middleware} from 'bedrock-service-core';
import {documentStores} from 'bedrock-service-agent';
import {validate} from './validator.js';

const {util: {BedrockError}} = bedrock;

export async function addRoutes({app, service} = {}) {
  const {routePrefix, serviceType} = service;

  const cfg = bedrock.config['service-context-store'];
  const routes = {
    contexts: `${routePrefix}/:localId/${cfg.routes.contexts}`
  };
  routes.context = `${routes.contexts}/:contextId`;

  const getConfigMiddleware = middleware.createGetConfigMiddleware({service});

  /* Note: CORS is used on all endpoints. This is safe because authorization
  uses HTTP signatures + capabilities, not cookies; CSRF is not possible. */

  // store a new context
  app.options(routes.contexts, cors());
  app.post(
    routes.contexts,
    cors(),
    validate({bodySchema: createContextBody}),
    getConfigMiddleware,
    middleware.authorizeConfigZcapInvocation(),
    asyncHandler(async (req, res) => {
      const {config} = req.serviceObject;
      const documentStore = await documentStores.get({config, serviceType});

      const {id, context} = req.body;
      const content = {
        id,
        type: 'JsonLdContext',
        context
      }
      try {
        await documentStore.upsert({
          content,
          async mutator() {
            // abort upsert due to duplicate
            const error = new Error('AbortError');
            error.name = 'AbortError';
            throw error;
          }
        });
      } catch(e) {
        if(e.name === 'AbortError') {
          throw new BedrockError('Duplicate context.', 'DuplicateError', {
            httpStatusCode: 409,
            public: true
          });
        }
        throw e;
      }

      const location = `${config.id}/${cfg.routes.contexts}/` +
        encodeURIComponent(id);
      res.status(201).location(location).json({id, context, sequence: 0});

      // meter operation usage
      metering.reportOperationUsage({req});
    }));

  // update an existing context
  app.options(routes.context, cors());
  app.post(
    routes.context,
    cors(),
    validate({bodySchema: updateContextBody}),
    getConfigMiddleware,
    middleware.authorizeConfigZcapInvocation(),
    asyncHandler(async (req, res) => {
      const {config} = req.serviceObject;
      const documentStore = await documentStores.get({config, serviceType});

      const {id, context, sequence} = req.body;
      const content = {
        id,
        type: 'JsonLdContext',
        context
      }
      try {
        await documentStore.upsert({
          content,
          async mutator({doc}) {
            if(doc.sequence !== (sequence - 1)) {
              // abort upsert due to out of sequence
              const error = new Error('AbortError');
              error.name = 'AbortError';
              error.actual = doc.sequence;
              throw error;
            }
            // update content, leave meta alone
            doc.content = content;
            return doc;
          }
        });
      } catch(e) {
        if(e.name === 'AbortError') {
          throw new BedrockError(
            'Could not update context; unexpected sequence.',
            'InvalidStateError', {
              expected: sequence - 1,
              actual: e.actual,
              httpStatusCode: 409,
              public: true
            });
        }
        throw e;
      }

      res.json({id, context, sequence});

      // meter operation usage
      metering.reportOperationUsage({req});
    }));

  // get a stored context
  app.get(
    routes.context,
    cors(),
    getConfigMiddleware,
    middleware.authorizeConfigZcapInvocation(),
    asyncHandler(async (req, res) => {
      const {config} = req.serviceObject;
      const documentStore = await documentStores.get({config, serviceType});

      let doc;
      try {
        doc = await documentStore.get({id});
      } catch(e) {
        // document not found
        if(e.name === 'NotFoundError') {
          throw new BedrockError('Context not found.', 'NotFoundError', {
            httpStatusCode: 404,
            public: true
          });
        }
        throw e;
      }

      if(doc.content.type !== 'JsonLdContext') {
        // invalid content type, treat as context not found
        throw new BedrockError('Context not found.', 'NotFoundError', {
          httpStatusCode: 404,
          public: true
        });
      }

      const result = {
        id: doc.content.id,
        context: doc.content.context,
        sequence: doc.sequence
      };

      res.json(result);
    }));
}
