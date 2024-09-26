import { Request, Response } from 'express';
import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import { allProducts } from '../products/fetch.productProjections';
import { getCustomObjects } from '../customObjects/fetch.customObjects';
import { postCustomObject } from '../customObjects/post.customObjects';

interface PriceValue {
  type: string;
  currencyCode: string;
  centAmount: number;
  fractionDigits: number;
}

interface PriceData {
  id: string;
  value: PriceValue;
  key?: string;
  country?: string;
}

interface Prices {
  [country: string]: {
    data: PriceData[];
  };
}

interface Result {
  sku?: string;
  labels: string[];
  prices: Prices;
}

export const post = async (_request: Request, response: Response) => {
  try {
    const products = await allProducts({});
    const date = new Date().toISOString().split('T')[0];

    const results: Result[] = await Promise.all(
      products.results.flatMap((product) => {
        const variants = [product.masterVariant, ...product.variants];
        return variants.map(async (variant) => {
          if (!variant.sku) {
            return { sku: '', labels: [], prices: {} };
          }
          const priceHistory = await getCustomObjects(variant.sku);

          if (!priceHistory) {
            //logger.info('Custom Object not found', { sku: variant.sku });
            const prices: Prices = {};
            variant.prices?.forEach((price) => {
              if (price.country) {
                if (!prices[price.country]) {
                  prices[price.country] = { data: [] };
                }
                prices[price.country].data.push({
                  id: price.id,
                  value: price.value,
                  key: price.key,
                  country: price.country,
                });
              }
            });
            return { sku: variant.sku, labels: [date], prices };
          } else {
            //logger.info('Custom Object found', { priceHistory });
            const labels = [...priceHistory.value.labels, date];
            const prices = { ...priceHistory.value.prices };
            variant.prices?.forEach((price) => {
              if (price.country) {
                if (!prices[price.country]) {
                  prices[price.country] = { data: [] };
                }
                prices[price.country].data.push({
                  id: price.id,
                  value: price.value,
                  key: price.key,
                  country: price.country,
                });
              }
            });
            return {
              sku: variant.sku,
              labels: labels,
              prices: prices,
            };
          }
        });
      })
    );

    results.forEach(async (result) => {
      /** 
       Uncomment this block to delete the custom objects (also add the import statement at the top)
      if (result.sku) {
        await deleteCustomObjects(result.sku);
      }
     */
      await postCustomObject(result);
    });

    response.status(200).send();
  } catch (error) {
    logger.info('Error', { error });
    throw new CustomError(
      500,
      `Internal Server Error - Error Updating price history`
    );
  }
};
