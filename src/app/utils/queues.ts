import RequestQueue from '../RequestQueue';

export const ledgerQueue = new RequestQueue(2, 3000);
export const prePaidQueue = new RequestQueue(1, 3000);
export const documentQueue = new RequestQueue(1, 3000);
export const defaultQueue = new RequestQueue(2, 3000);
export const downloaderQueue = new RequestQueue(1, 5000);
