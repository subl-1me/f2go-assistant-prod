import RequestQueue from '../RequestQueue';

export const ledgerQueue = new RequestQueue(3, 2000);
export const prePaidQueue = new RequestQueue(3, 2000);
export const documentQueue = new RequestQueue(2, 2000);
export const defaultQueue = new RequestQueue(4, 2000);
export const downloaderQueue = new RequestQueue(2, 5000);
