/*!
 * Copyright (c) 2019-2025 Digital Bazaar, Inc. All rights reserved.
 */
import * as helpers from './helpers.js';
import {agent} from '@bedrock/https-agent';
import {CapabilityAgent} from '@digitalbazaar/webkms-client';
// FIXME: `createTypeTableLoader`
import {createContextDocumentLoader} from '@bedrock/service-context-store';
import {documentStores} from '@bedrock/service-agent';
import {httpClient} from '@digitalbazaar/http-client';

import {mockData} from './mock.data.js';

const CBORLD_REGISTRY_ENTRY_PREFIX = 'urn:cborld:registry-entry:';
const {baseUrl} = mockData;

describe('CBOR-LD registry entry HTTP API', () => {
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
  it('fails to inserts a registry entry due to bad zcap', async () => {
    const config = await helpers.createConfig({capabilityAgent, zcaps});

    // insert `registryEntry`
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const client = helpers.createZcapClient({capabilityAgent});
    const url = `${config.id}/cborld-registry-entries`;

    // intentionally bad root zcap here; the root zcap must be for the
    // service object config, not `/cborld-registry-entries` URL as it is set
    // here
    const rootZcap = `urn:zcap:root:${encodeURIComponent(url)}`;

    let err;
    try {
      await client.write({
        url, json: {id, registryEntry},
        capability: rootZcap
      });
    } catch(e) {
      err = e;
    }
    should.exist(err);
    err.data.type.should.equal('NotAllowedError');
  });
  it('inserts an array registry entry', async () => {
    const config = await helpers.createConfig({capabilityAgent, zcaps});
    const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

    // insert `registryEntry`
    const registryEntry = structuredClone(mockData.registryEntryArray);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const client = helpers.createZcapClient({capabilityAgent});
    const url = `${config.id}/cborld-registry-entries`;

    let err;
    let response;
    try {
      response = await client.write({
        url, json: {id, registryEntry},
        capability: rootZcap
      });
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(response);
    should.exist(response.data);
    response.data.should.deep.equal({
      id,
      registryEntry,
      sequence: 0
    });
  });
  it('inserts an object registry entry', async () => {
    const config = await helpers.createConfig({capabilityAgent, zcaps});
    const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

    // insert `registryEntry`
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const client = helpers.createZcapClient({capabilityAgent});
    const url = `${config.id}/cborld-registry-entries`;

    let err;
    let response;
    try {
      response = await client.write({
        url, json: {id, registryEntry},
        capability: rootZcap
      });
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(response);
    should.exist(response.data);
    response.data.should.deep.equal({
      id,
      registryEntry,
      sequence: 0
    });
  });
  it('inserts a registry entry w/oauth2', async () => {
    const config = await helpers.createConfig(
      {capabilityAgent, zcaps, oauth2: true});

    // insert `registryEntry`
    const accessToken = await helpers.getOAuth2AccessToken({
      configId: config.id,
      action: 'write',
      target: '/cborld-registry-entries'
    });
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const url = `${config.id}/cborld-registry-entries`;

    let err;
    let response;
    try {
      response = await httpClient.post(url, {
        agent,
        headers: {authorization: `Bearer ${accessToken}`},
        json: {id, registryEntry}
      });
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(response);
    should.exist(response.data);
    response.data.should.deep.equal({
      id,
      registryEntry,
      sequence: 0
    });
  });
  it('throws error on no "registryEntry"', async () => {
    const config = await helpers.createConfig({capabilityAgent, zcaps});
    const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const client = helpers.createZcapClient({capabilityAgent});
    const url = `${config.id}/cborld-registry-entries`;

    let err;
    let result;
    try {
      await client.write({url, json: {id}, capability: rootZcap});
    } catch(e) {
      err = e;
    }
    should.exist(err);
    should.not.exist(result);
    err.data.type.should.equal('ValidationError');
    err.data.message.should.equal(
      'A validation error occurred in the \'createCborLdRegistryEntryBody\' ' +
      'validator.');
  });
  it('updates a registry entry', async () => {
    const config = await helpers.createConfig({capabilityAgent, zcaps});
    const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

    // insert `registryEntry`
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const client = helpers.createZcapClient({capabilityAgent});
    let url = `${config.id}/cborld-registry-entries`;
    await client.write({
      url, json: {id, registryEntry},
      capability: rootZcap
    });

    // update `registryEntry`
    registryEntry.context['https://w3id.org/vc-barcodes/v1'] = 2;
    url = `${url}/${encodeURIComponent(id)}`;
    let err;
    let response;
    try {
      response = await client.write({
        url, json: {id, registryEntry, sequence: 1},
        capability: rootZcap
      });
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(response);
    should.exist(response.data);
    response.data.should.deep.equal({
      id,
      registryEntry,
      sequence: 1
    });
  });
  it('updates a registry entry w/oauth2 w/root scope', async () => {
    const config = await helpers.createConfig(
      {capabilityAgent, zcaps, oauth2: true});

    // insert `registryEntry`
    const accessToken = await helpers.getOAuth2AccessToken({
      configId: config.id,
      action: 'write',
      target: '/cborld-registry-entries'
    });
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    let url = `${config.id}/cborld-registry-entries`;
    await httpClient.post(url, {
      agent,
      headers: {authorization: `Bearer ${accessToken}`},
      json: {id, registryEntry}
    });

    // update `registryEntry`
    registryEntry.context['https://w3id.org/vc-barcodes/v1'] = 2;
    url = `${url}/${encodeURIComponent(id)}`;
    let err;
    let response;
    try {
      response = await httpClient.post(url, {
        agent,
        headers: {authorization: `Bearer ${accessToken}`},
        json: {id, registryEntry, sequence: 1}
      });
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(response);
    should.exist(response.data);
    response.data.should.deep.equal({
      id,
      registryEntry,
      sequence: 1
    });
  });
  it('updates a registry entry w/oauth2 w/targeted scope', async () => {
    const config = await helpers.createConfig(
      {capabilityAgent, zcaps, oauth2: true});

    // insert `registryEntry`
    const accessToken = await helpers.getOAuth2AccessToken({
      configId: config.id,
      action: 'write',
      target: '/cborld-registry-entries'
    });
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    let url = `${config.id}/cborld-registry-entries`;
    await httpClient.post(url, {
      agent,
      headers: {authorization: `Bearer ${accessToken}`},
      json: {id, registryEntry}
    });

    // update `registryEntry`
    registryEntry.context['https://w3id.org/vc-barcodes/v1'] = 2;
    url = `${url}/${encodeURIComponent(id)}`;
    let err;
    let response;
    try {
      const accessToken = await helpers.getOAuth2AccessToken({
        configId: config.id, action: 'write',
        // use specific registry entry target
        target: `/cborld-registry-entries/${encodeURIComponent(id)}`
      });
      response = await httpClient.post(url, {
        agent,
        headers: {authorization: `Bearer ${accessToken}`},
        json: {id, registryEntry, sequence: 1}
      });
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(response);
    should.exist(response.data);
    response.data.should.deep.equal({
      id,
      registryEntry,
      sequence: 1
    });
  });
  it('fails to update a registry entry w/oauth2 w/wrong scope', async () => {
    const config = await helpers.createConfig(
      {capabilityAgent, zcaps, oauth2: true});

    // insert `registryEntry`
    const accessToken = await helpers.getOAuth2AccessToken({
      configId: config.id,
      action: 'write',
      target: '/cborld-registry-entries'
    });
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    let url = `${config.id}/cborld-registry-entries`;
    await httpClient.post(url, {
      agent,
      headers: {authorization: `Bearer ${accessToken}`},
      json: {id, registryEntry}
    });

    // update `registryEntry`
    registryEntry.context['https://w3id.org/vc-barcodes/v1'] = 2;
    url = `${url}/${encodeURIComponent(id)}`;
    let err;
    let response;
    try {
      const accessToken = await helpers.getOAuth2AccessToken({
        configId: config.id, action: 'write',
        // wrong target
        target: `/foo`
      });
      response = await httpClient.post(url, {
        agent,
        headers: {authorization: `Bearer ${accessToken}`},
        json: {id, registryEntry, sequence: 1}
      });
    } catch(e) {
      err = e;
    }
    should.exist(err);
    should.not.exist(response);
    err.status.should.equal(403);
    err.data.type.should.equal('NotAllowedError');
    should.exist(err.data.cause);
    should.exist(err.data.cause.details);
    should.exist(err.data.cause.details.code);
    err.data.cause.details.code.should.equal(
      'ERR_JWT_CLAIM_VALIDATION_FAILED');
    should.exist(err.data.cause.details.claim);
    err.data.cause.details.claim.should.equal('scope');
  });
  it('fails to update a registry entry with wrong sequence', async () => {
    const config = await helpers.createConfig({capabilityAgent, zcaps});
    const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

    // insert `registryEntry`
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const client = helpers.createZcapClient({capabilityAgent});
    let url = `${config.id}/cborld-registry-entries`;
    await client.write({
      url, json: {id, registryEntry},
      capability: rootZcap
    });

    // update `registryEntry`
    registryEntry.context['https://w3id.org/vc-barcodes/v1'] = 2;
    url = `${url}/${encodeURIComponent(id)}`;
    let err;
    let response;
    try {
      response = await client.write({
        url, json: {id, registryEntry, sequence: 10},
        capability: rootZcap
      });
    } catch(e) {
      err = e;
    }
    should.exist(err);
    should.not.exist(response);
    err.data.type.should.equal('InvalidStateError');
  });
  it('gets a registry entry', async () => {
    const config = await helpers.createConfig({capabilityAgent, zcaps});
    const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

    // insert `registryEntry`
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const client = helpers.createZcapClient({capabilityAgent});
    let url = `${config.id}/cborld-registry-entries`;
    await client.write({
      url, json: {id, registryEntry},
      capability: rootZcap
    });

    url = `${url}/${encodeURIComponent(id)}`;
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
      id,
      registryEntry,
      sequence: 0
    });
  });
  it.skip('gets a registry entry with a type table loader', async () => {
    const config = await helpers.createConfig({capabilityAgent, zcaps});
    const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

    // insert `registryEntry`
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const client = helpers.createZcapClient({capabilityAgent});
    const url = `${config.id}/cborld-registry-entries`;
    await client.write({
      url, json: {id, registryEntry},
      capability: rootZcap
    });

    const documentLoader = await createContextDocumentLoader({
      config, serviceType
    });

    let err;
    let result;
    try {
      result = await documentLoader(id);
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(result);
    should.exist(result.documentUrl);
    should.exist(result.document);
    // FIXME:
    result.documentUrl.should.equal(id);
    result.document.should.deep.equal(context);
  });
  it.skip('fails to get a registry entry with wrong meta type', async () => {
    const config = await helpers.createConfig({capabilityAgent, zcaps});
    const rootZcap = `urn:zcap:root:${encodeURIComponent(config.id)}`;

    // insert `registryEntry`
    const registryEntry = structuredClone(mockData.registryEntryObject);
    const id = `${CBORLD_REGISTRY_ENTRY_PREFIX}10`;
    const client = helpers.createZcapClient({capabilityAgent});
    const url = `${config.id}/cborld-registry-entries`;
    await client.write({
      url, json: {id, registryEntry},
      capability: rootZcap
    });

    // get registry entry successfully
    const documentLoader = await createContextDocumentLoader({
      config, serviceType
    });

    let err;
    let result;
    try {
      result = await documentLoader(id);
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(result);
    should.exist(result.documentUrl);
    should.exist(result.document);
    // FIXME:
    result.documentUrl.should.equal(id);
    result.document.should.deep.equal(context);

    // now erroneously update registry entry to new meta type
    const {documentStore} = await documentStores.get({config, serviceType});
    await documentStore.upsert({
      content: {id, registryEntry},
      meta: {type: 'different'}
    });

    try {
      await documentLoader(id);
    } catch(e) {
      err = e;
    }
    should.exist(err);
    err.name.should.equal('NotFoundError');
  });
});
