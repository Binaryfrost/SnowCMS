import { type RequestHandler, Router } from 'express';

export function asyncRouteFix<T extends RequestHandler>(callback: T): RequestHandler {
  return (req, res, next) => {
    new Promise((resolve) => {
      resolve(callback(req, res, next));
    }).catch(next);
  };
}
