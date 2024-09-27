import { createApiRoot } from '../client/create.client';

import { logger } from '../utils/logger.utils';

export const postCustomObject = async (value: any, sku?: string) => {
  logger.info('Creating/Updating Custom Object price-history/', sku, value.sku);
  try {
    const { body } = await createApiRoot()
      .customObjects()
      .post({
        body: {
          container: 'price-history',
          key: sku || value.sku,
          value: {
            labels: value.value?.labels || value.labels,
            prices: value.value?.prices || value.prices,
          },
        },
      })
      .execute();

    return body;
  } catch (error) {
    logger.info('Error creating/updating Custom Object', { error });
  }
};

export const deleteCustomObjects = async (sku: string) => {
  try {
    const { body } = await createApiRoot()
      .customObjects()
      .withContainerAndKey({
        container: 'price-history',
        key: sku,
      })
      .delete()
      .execute();

    return body;
  } catch (error) {
    logger.info('Error deleting Custom Object', { error });
  }
};

export const updateCustomObject = async (value: any) => {
  logger.info('Creating/Updating Custom Object price-history/', value.sku);
  try {
    const { body } = await createApiRoot()
      .customObjects()
      .post({
        body: {
          container: 'price-history',
          key: value.sku,
          value: {
            labels: value.labels,
            prices: value.prices,
          },
        },
      })
      .execute();

    return body;
  } catch (error) {
    logger.info('Error creating/updating Custom Object', { error });
  }
};
