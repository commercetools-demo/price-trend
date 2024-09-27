//import { CustomObjectPagedQueryResponse } from '@commercetools/platform-sdk';
import { createApiRoot } from '../client/create.client';
import { logger } from '../utils/logger.utils';
//import { getAll } from './modifier.customObjects';
//import { GetFunction } from '../types/index.types';

export const getCustomObjects = async (sku: string) => {
  logger.info('Fetching Custom Object price-history/', sku);
  try {
    const { body } = await createApiRoot()
      .customObjects()
      .withContainerAndKey({
        container: 'price-history',
        key: sku,
      })
      .get()
      .execute();

    return body;
  } catch (error) {
    logger.info('Error fetching Custom Object', { error });
  }
};
