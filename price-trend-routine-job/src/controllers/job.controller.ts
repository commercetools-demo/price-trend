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

const processVariant = async (variant: any, date: string): Promise<Result> => {
  const sanitizedSku = variant.sku.replace(/\s+/g, '-');

  const priceHistory = await getCustomObjects(sanitizedSku);

  const prices: Prices = {};
  variant.prices?.forEach((price: PriceData) => {
    if (price.country) {
      if (!prices[price.country]) prices[price.country] = { data: [] };
      prices[price.country].data.push({
        id: price.id,
        value: price.value,
        key: price.key,
        country: price.country,
      });
    }
  });

  if (!priceHistory) {
    return { sku: sanitizedSku, labels: [date], prices };
  }

  const existingDateIndex = priceHistory.value.labels.indexOf(date);

  if (existingDateIndex === -1) {
    priceHistory.value.labels.push(date);
    Object.keys(prices).forEach((country) => {
      if (!priceHistory.value.prices[country]) {
        priceHistory.value.prices[country] = { data: [] };
      }
      priceHistory.value.prices[country].data.push(...prices[country].data);
    });
    await Promise.resolve(postCustomObject(priceHistory.value, variant.sku));
    return { sku: '', labels: [], prices: {} };
  }

  if (existingDateIndex !== -1) {
    let changeIndicator = false;
    variant.prices?.forEach((price: PriceData) => {
      if (price.country && priceHistory.value.prices[price.country]) {
        const historicalPrice =
          priceHistory.value.prices[price.country].data[existingDateIndex];
        if (price.value.centAmount < historicalPrice.value.centAmount) {
          logger.info('smaller', {
            sku: sanitizedSku,
            country: price.country,
            date,
          });
          changeIndicator = true;
          priceHistory.value.prices[price.country].data[existingDateIndex] = {
            id: price.id,
            value: price.value,
            key: price.key,
            country: price.country,
          };
        } else if (price.value.centAmount > historicalPrice.value.centAmount) {
          logger.info('bigger - not updating it', {
            sku: sanitizedSku,
            country: price.country,
            date,
          });
        }
      }
    });
    if (changeIndicator)
      await Promise.resolve(postCustomObject(priceHistory.value, variant.sku));
    return { sku: '', labels: [], prices: {} };
  }
  return { sku: '', labels: [], prices: {} };
};

export const post = async (_request: Request, response: Response) => {
  try {
    const products = await allProducts({});
    const date = new Date().toISOString().split('T')[0];
    const results: Result[] = await Promise.all(
      products.results.flatMap((product) =>
        [product.masterVariant, ...product.variants].map((variant) =>
          processVariant(variant, date)
        )
      )
    );

    const filteredResults = results.filter((result) => result.sku !== '');
    await Promise.all(
      filteredResults.map((result) => postCustomObject(result))
    );

    response.status(200).send();
  } catch (error) {
    logger.info('Error', { error });
    throw new CustomError(
      500,
      `Internal Server Error - Error Updating price history`
    );
  }
};
