/*!
 * Copyright (c) 2019-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as helpers from './helpers.js';
import {agent} from '@bedrock/https-agent';
import {createContextDocumentLoader} from '@bedrock/service-context-store';
import {createRequire} from 'node:module';
import {documentStores} from '@bedrock/service-agent';
const require = createRequire(import.meta.url);
const {CapabilityAgent} = require('@digitalbazaar/webkms-client');
const {httpClient} = require('@digitalbazaar/http-client');

import {mockData} from './mock.data.js';

const {baseUrl} = mockData;

describe('HTTP API', () => {
  describe('service objects', () => {
    const serviceType = 'example';
    let capabilityAgent;
    const zcaps = {};
    beforeEach(async () => {
      const secret = '53ad64ce-8e1d-11ec-bb12-10bf48838a41';
      const handle = 'test';
      capabilityAgent = await CapabilityAgent.fromSecret({secret, handle});

      // create keystore for capability agent
      const keystoreAgent = await helpers.createKeystoreAgent(
        {capabilityAgent});

      // create EDV for storage (creating hmac and kak in the process)
      const {
        edvConfig,
        hmac,
        keyAgreementKey
      } = await helpers.createEdv({capabilityAgent, keystoreAgent});

      // get service agent to delegate to
      const serviceAgentUrl =
        `${baseUrl}/service-agents/${encodeURIComponent(serviceType)}`;
      const {data: serviceAgent} = await httpClient.get(serviceAgentUrl, {
        agent
      });

      // delegate edv, hmac, and key agreement key zcaps to service agent
      const {id: edvId} = edvConfig;
      zcaps.edv = await helpers.delegate({
        controller: serviceAgent.id,
        delegator: capabilityAgent,
        invocationTarget: edvId
      });
      const {keystoreId} = keystoreAgent;
      zcaps.hmac = await helpers.delegate({
        capability: `urn:zcap:root:${encodeURIComponent(keystoreId)}`,
        controller: serviceAgent.id,
        invocationTarget: hmac.id,
        delegator: capabilityAgent
      });
      zcaps.keyAgreementKey = await helpers.delegate({
        capability: `urn:zcap:root:${encodeURIComponent(keystoreId)}`,
        controller: serviceAgent.id,
        invocationTarget: keyAgreementKey.kmsId,
        delegator: capabilityAgent
      });
    });
    it('fails to inserts a context due to bad zcap', async () => {
      const config = await helpers.createConfig({capabilityAgent, zcaps});

      // insert `context`
      const contextId = 'https://test.example/v1';
      const context = {'@context': {term: 'https://test.example#term'}};
      const client = helpers.createZcapClient({capabilityAgent});
      const url = `${config.id}/contexts`;

      // intentionally bad root zcap here; the root zcap must be for the
      // service object config, not `/contexts` URL as it is set here
      const rootZcap = `urn:zcap:root:${encodeURIComponent(url)}`;

      let err;
      try {
        await client.write({
          url, json: {id: contextId, context},
          capability: rootZcap
        });
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.data.type.should.equal('NotAllowedError');
    });
    it('inserts a context', async () => {
      const config = await helpers.createConfig({capabilityAgent, zcaps});
      const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

      // insert `context`
      const contextId = 'https://test.example/v1';
      const context = {'@context': {term: 'https://test.example#term'}};
      const client = helpers.createZcapClient({capabilityAgent});
      const url = `${config.id}/contexts`;

      let err;
      let response;
      try {
        response = await client.write({
          url, json: {id: contextId, context},
          capability: rootZcap
        });
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(response);
      should.exist(response.data);
      response.data.should.deep.equal({
        id: 'https://test.example/v1',
        context,
        sequence: 0
      });
    });
    it('throws error on no "context"', async () => {
      const config = await helpers.createConfig({capabilityAgent, zcaps});
      const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

      const contextId = 'https://test.example/v1';
      const client = helpers.createZcapClient({capabilityAgent});
      const url = `${config.id}/contexts`;

      let err;
      let result;
      try {
        await client.write({url, json: {id: contextId}, capability: rootZcap});
      } catch(e) {
        err = e;
      }
      should.exist(err);
      should.not.exist(result);
      err.data.type.should.equal('ValidationError');
      err.data.message.should.equal(
        'A validation error occured in the \'createContextBody\' validator.');
    });
    it('updates a context', async () => {
      const config = await helpers.createConfig({capabilityAgent, zcaps});
      const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

      // insert `context`
      const contextId = 'https://test.example/v1';
      const context = {'@context': {term: 'https://test.example#term'}};
      const client = helpers.createZcapClient({capabilityAgent});
      let url = `${config.id}/contexts`;
      await client.write({
        url, json: {id: contextId, context},
        capability: rootZcap
      });

      // update `context`
      context['@context'].term2 = 'https://test.example#term2';
      url = `${url}/${encodeURIComponent(contextId)}`;
      let err;
      let response;
      try {
        response = await client.write({
          url, json: {id: contextId, context, sequence: 1},
          capability: rootZcap
        });
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(response);
      should.exist(response.data);
      response.data.should.deep.equal({
        id: 'https://test.example/v1',
        context,
        sequence: 1
      });
    });
    it('fails to update a context with wrong sequence', async () => {
      const config = await helpers.createConfig({capabilityAgent, zcaps});
      const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

      // insert `context`
      const contextId = 'https://test.example/v1';
      const context = {'@context': {term: 'https://test.example#term'}};
      const client = helpers.createZcapClient({capabilityAgent});
      let url = `${config.id}/contexts`;
      await client.write({
        url, json: {id: contextId, context},
        capability: rootZcap
      });

      // update `context`
      context['@context'].term2 = 'https://test.example#term2';
      url = `${url}/${encodeURIComponent(contextId)}`;
      let err;
      let response;
      try {
        response = await client.write({
          url, json: {id: contextId, context, sequence: 10},
          capability: rootZcap
        });
      } catch(e) {
        err = e;
      }
      should.exist(err);
      should.not.exist(response);
      err.data.type.should.equal('InvalidStateError');
    });
    it('gets a context', async () => {
      const config = await helpers.createConfig({capabilityAgent, zcaps});
      const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

      // insert `context`
      const contextId = 'https://test.example/v1';
      const context = {'@context': {term: 'https://test.example#term'}};
      const client = helpers.createZcapClient({capabilityAgent});
      let url = `${config.id}/contexts`;
      await client.write({
        url, json: {id: contextId, context},
        capability: rootZcap
      });

      url = `${url}/${encodeURIComponent(contextId)}`;
      let err;
      let response;
      try {
        response = await client.read({
          url, capability: rootZcap
        });
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(response);
      should.exist(response.data);
      response.data.should.deep.equal({
        id: 'https://test.example/v1',
        context,
        sequence: 0
      });
    });
    it('gets a context with a context document loader', async () => {
      const config = await helpers.createConfig({capabilityAgent, zcaps});
      const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

      // insert `context`
      const contextId = 'https://test.example/v1';
      const context = {'@context': {term: 'https://test.example#term'}};
      const client = helpers.createZcapClient({capabilityAgent});
      const url = `${config.id}/contexts`;
      await client.write({
        url, json: {id: contextId, context},
        capability: rootZcap
      });

      const documentLoader = await createContextDocumentLoader({
        config, serviceType
      });

      let err;
      let result;
      try {
        result = await documentLoader(contextId);
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(result);
      should.exist(result.documentUrl);
      should.exist(result.document);
      result.documentUrl.should.equal(contextId);
      result.document.should.deep.equal(context);
    });
    it('fails to get a context with wrong meta type', async () => {
      const config = await helpers.createConfig({capabilityAgent, zcaps});
      const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

      // insert `context`
      const contextId = 'https://test.example/v1';
      const context = {'@context': {term: 'https://test.example#term'}};
      const client = helpers.createZcapClient({capabilityAgent});
      const url = `${config.id}/contexts`;
      await client.write({
        url, json: {id: contextId, context},
        capability: rootZcap
      });

      // get context successfully
      const documentLoader = await createContextDocumentLoader({
        config, serviceType
      });

      let err;
      let result;
      try {
        result = await documentLoader(contextId);
      } catch(e) {
        err = e;
      }
      assertNoError(err);
      should.exist(result);
      should.exist(result.documentUrl);
      should.exist(result.document);
      result.documentUrl.should.equal(contextId);
      result.document.should.deep.equal(context);

      // now erroneously update context to new meta type
      const docStore = await documentStores.get({config, serviceType});
      await docStore.upsert({
        content: {id: contextId, context},
        meta: {type: 'different'}
      });

      try {
        await documentLoader(contextId);
      } catch(e) {
        err = e;
      }
      should.exist(err);
      err.name.should.equal('NotFoundError');
    });
  });
});
