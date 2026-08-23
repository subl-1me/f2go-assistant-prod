import { environment } from '../../environment.example';

const batchSize = Number(environment.BATCH_SIZE) || 3; // default

export const fetchInBatch = async (
  checkPromises: any,
  customBatchSize?: number
): Promise<any> => {
  const results: any[] = [];
  console.log(checkPromises);

  for (let i = 0; i < checkPromises.length; i += batchSize) {
    const batchStart = i;
    const batchEnd = i + batchSize;
    const currentBatch = checkPromises.slice(batchStart, batchEnd);

    console.log(
      `BATCH #${Math.ceil(batchStart / batchSize) + 1} ~ ` +
        `Processing ${currentBatch.length} requests (${batchStart}-${
          Math.min(batchEnd, checkPromises.length) - 1
        })`
    );

    try {
      const batchResults = await Promise.all(currentBatch);
      results.push(...batchResults);
    } catch (error) {
      console.error(
        `Error in batch ${Math.ceil(batchStart / batchSize) + 1}:`,
        error
      );
      throw error;
    }
  }

  return results;
};
