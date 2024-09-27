import { createApiRoot } from '../client/create.client';
import { logger } from '../utils/logger.utils';

export const deleteCustomObjects = async (sku: string) => {
  logger.info('Deleting Custom Object price-history/', { sku });
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
