import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class RequestQueueService {
  private static instance: RequestQueueService;
  private pendingRequest: Promise<any>[] = [];
  private queue: Array<() => Promise<any>> = [];

  private activeRequests = 0;
  private maxConcurrent = 2;
  private delayBetweenRequest = 500;
  private isProcessing = false;

  constructor() {}

  public static getInstance(): RequestQueueService {
    if (!RequestQueueService.instance) {
      RequestQueueService.instance = new RequestQueueService();
    }

    return RequestQueueService.instance;
  }

  public clearPendingRequests(): void {
    this.pendingRequest = [];
  }

  public addRequest(requestFn: () => Promise<any>): Promise<any> {
    const promise = new Promise(async (resolve, reject) => {
      console.log('Adding request to queue...');
      const wrappedRequest = async () => {
        try {
          const result = await requestFn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      this.queue.push(wrappedRequest);
      await this.processQueue();
    });

    this.pendingRequest.push(promise);
    return promise;
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

  public async waitForAll(): Promise<any[]> {
    return Promise.all(this.pendingRequest);
  }
}
