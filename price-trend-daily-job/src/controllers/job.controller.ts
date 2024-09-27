import { Request, Response } from 'express';

import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import { allProducts } from '../products/fetch.productProjections';
import { getAllCustomObjects } from '../customObjects/fetch.customObjects';
import { deleteCustomObjects } from '../customObjects/post.customObjects';

/**
 * Exposed job endpoint.
 *
 * @param {Request} _request The express request
 * @param {Response} response The express response
 * @returns
 */
export const post = async (_request: Request, response: Response) => {
  try {
    // Get the Products
    const products = await allProducts({});
    const allPrices = await getAllCustomObjects();

    const allSkus = products.results.reduce((acc, product) => {
      if (product.masterVariant.sku) {
        acc.push(product.masterVariant.sku);
      }
      acc.push(
        ...product.variants
          .map((variant) => variant.sku)
          .filter((sku): sku is string => sku !== undefined)
      );
      return acc;
    }, [] as string[]);

    const allKeys = allPrices?.results.reduce((acc, price) => {
      if (price.key) {
        acc.push(price.key);
      }
      return acc;
    }, [] as string[]);

    const missingSkus = allKeys?.filter(
      (sku) => sku && !allSkus?.includes(sku)
    );

    if (!missingSkus || missingSkus.length === 0) {
      logger.info('No price history to be cleaned up.');
    } else {
      logger.info('Cleaning up price history for missing skus', {
        missingSkus,
      });
      missingSkus?.forEach(async (sku) => {
        await deleteCustomObjects(sku);
      });
    }
    response.status(200).json({ missingSkus });
  } catch (error) {
    throw new CustomError(
      500,
      `Internal Server Error - Error retrieving all orders from the commercetools SDK`
    );
  }
};
