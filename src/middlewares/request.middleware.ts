import { AsyncLocalStorage } from 'node:async_hooks';
import { v4 as uuid } from 'uuid';
import { Request, Response, NextFunction } from 'express';

const storage = new AsyncLocalStorage<Map<string, any>>();

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const store = new Map<string, any>();
  store.set('requestId', uuid());
  storage.run(store, next);
};

export const getRequestId = () => {
  return storage.getStore()?.get('requestId');
};
