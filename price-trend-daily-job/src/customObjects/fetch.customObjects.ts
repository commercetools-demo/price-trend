import { createApiRoot } from '../client/create.client';
import { logger } from '../utils/logger.utils';

export const getAllCustomObjects = async () => {
  logger.info('Fetching All Custom Object price-history/');
  try {
    const { body } = await createApiRoot()
      .customObjects()
      .withContainer({
        container: 'price-history',
      })
      .get({
        queryArgs: {
          limit: 500,
        },
      })
      .execute();

    return body;
  } catch (error) {
    logger.info('Error fetching Custom Object', { error });
  }
};
