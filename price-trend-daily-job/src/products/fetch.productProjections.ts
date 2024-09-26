import { ProductProjectionPagedQueryResponse } from '@commercetools/platform-sdk';

import { createApiRoot } from '../client/create.client';
import { getAll } from './modifier.productProjection';
import { GetFunction } from '../types/index.types';
import { logger } from '../utils/logger.utils';

const getProductsSet: GetFunction<ProductProjectionPagedQueryResponse> = async (
  queryArgs
) => {
  logger.info('Fetching products/variants');
  const { body } = await createApiRoot()
    .productProjections()
    .get({ queryArgs })
    .execute();
  return body;
};

export const allProducts: GetFunction<ProductProjectionPagedQueryResponse> =
  getAll(getProductsSet);
