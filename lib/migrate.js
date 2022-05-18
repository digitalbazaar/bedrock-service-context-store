/*!
 * Copyright (c) 2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import * as database from '@bedrock/mongodb';
import {documentStores, serviceAgents} from '@bedrock/service-agent';
import {logger} from './logger.js';

const MIGRATE_DATE = new Date('2022-05-24T00:00:00Z');

// determine when to run migration based on test/live mode
bedrock.events.on('bedrock-cli.ready', () => {
  let event;
  const command = bedrock.config.cli.command;
  if(command.name() === 'test') {
    event = 'bedrock.ready';
  } else {
    event = 'bedrock-server.readinessCheck';
  }

  bedrock.events.on(event, async () => {
    const {migration} = bedrock.config['service-context-store'];
    if(migration.migrateContexts) {
      await _migrateContexts();
    }
  });
});

async function _migrateContexts() {
  /* Note: This update depends on reading service agent records that have
  never been updated (sequence === 0) and were created before `MIGRATE_DATE`.
  Most applications have a single service agent record. Once the migration is
  complete, the service agent record will be updated and have a sequence of
  `1`, preventing further attempts to perform the migration. */

  // find all service agent records with `sequence` of `0` and a creation date
  // prior to the migrate date
  const query = {
    'serviceAgent.sequence': 0,
    'meta.created': {$lte: MIGRATE_DATE.getTime()}
  };
  const projection = {_id: 0, serviceAgent: 1, meta: 1};
  const options = {projection, limit: 1000};
  const records = await serviceAgents.find({query, options});
  if(records.length === 1000) {
    // generally unexpected so complexity is not supported
    throw new Error('Too many service agent records to perform migration.');
  }

  if(records.length === 0) {
    logger.debug('No service agents to migrate contexts for.');
    return;
  }

  logger.debug(`Attempting to migrate ${records.length} service agents.`);

  // could be performed in parallel, but there's likely just one record and
  // doing it serially is less error prone / easier to recover from
  for(const record of records) {
    let errors = 0;

    // create storage for service object configs
    const {serviceAgent} = record;
    const {serviceType} = serviceAgent;

    // get all configs
    const query = {};
    const projection = {_id: 0, config: 1, meta: 1};
    const options = {projection};
    const collectionName = `service-core-config-${serviceType}`;
    const collection = database.collections[collectionName];
    const configRecords = await collection.find(query, options).toArray();

    logger.debug(
      `Attempting to migrate ${configRecords.length} service object ` +
      `configs for service agent "${serviceAgent.id}".`);

    // process configs serially to enable easier recovery on errors
    for(const {config} of configRecords) {
      try {
        // get document store for the config
        const documentStore = await documentStores.get({config, serviceType});
        const {edvClient} = documentStore;

        // find all context EDV documents and duplicate them, ignoring
        // duplicate errors (other processes might also be performing the
        // migration)
        const {documents} = await edvClient.find({has: 'content.id'});
        const promises = [];
        for(const doc of documents) {
          if(doc?.content?.type === 'JsonLdContext') {
            const {id, context} = doc.content;
            promises.push(_upsertContext({documentStore, id, context}));
          }
        }

        const results = await Promise.all(promises);
        logger.debug(
          `Successfully migrated ${results.length} contexts for config ` +
          `"${config.id}".`);
      } catch(error) {
        errors++;
        logger.error(
          `Could not migrate contexts for config "${config.id}".`, {error});
      }
    }

    // only update service agent if no errors occurred
    if(errors === 0) {
      // update service agent (bump sequence number)
      serviceAgent.sequence++;
      try {
        await serviceAgents.update({serviceAgent});
      } catch(e) {
        // ignore invalid state error because of concurrent migration update;
        // throw other errors
        if(e.name !== 'InvalidStateError') {
          throw e;
        }
      }
    }

    logger.debug(
      `Successfully migrated ` +
      `${configRecords.length - errors} / ${configRecords.length} service ` +
      `object configs for service agent "${serviceAgent.id}".`);
  }

  logger.debug(`Migration of ${records.length} service agents complete.`);
}

async function _upsertContext({documentStore, id, context}) {
  const content = {id, context};
  const meta = {type: 'JsonLdContext'};

  try {
    await documentStore.upsert({
      content, meta,
      async mutator() {
        // abort upsert due to duplicate
        const error = new Error('AbortError');
        error.name = 'AbortError';
        throw error;
      }
    });
  } catch(e) {
    if(e.name === 'AbortError') {
      logger.debug(`Duplicate context "${id}"; skipping migration...`);
      return;
    }
    throw e;
  }
}
