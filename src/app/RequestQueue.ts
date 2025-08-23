export default class RequestQueue {
  private queue: Array<() => Promise<any>> = [];

  private activeRequests = 0;
  private maxConcurrent;
  private delayBetweenRequest;
  private isProcessing = false;

  constructor(maxConcurrent: number, delay: number) {
    this.maxConcurrent = maxConcurrent;
    this.delayBetweenRequest = delay;
  }

  public addRequest(requestFn: () => Promise<any>): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const wrappedRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      };

      this.queue.push(wrappedRequest);
      await this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    console.log('Processing request queue...');
    if (this.isProcessing || this.activeRequests >= this.maxConcurrent) {
      console.log(
        'Queue is already being processed or max concurrent requests reached.'
      );
      return;
    }

    this.isProcessing = true;
    while (this.queue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const requestFn = this.queue.shift();
      if (requestFn) {
        this.activeRequests++;

        requestFn().finally(() => {
          this.activeRequests--;
          console.log(
            'Request completed, active requests:',
            this.activeRequests
          );
          this.processQueue();
        });

        // add delay if it is not the first request in the batch
        if (this.activeRequests < this.maxConcurrent && this.queue.length > 0) {
          console.log(
            `Waiting for ${this.delayBetweenRequest}ms before processing next request...`
          );
          await new Promise((resolve) =>
            setTimeout(resolve, this.delayBetweenRequest)
          );
        }
      }
    }

    this.isProcessing = false;
  }
}
