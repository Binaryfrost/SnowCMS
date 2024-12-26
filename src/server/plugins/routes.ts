import express, { type Router } from 'express';
import { PluginConfig } from '../../config';
import { loadPlugins } from '../../common/plugins/plugins';

export type Route = (router: Router) => void;

const router = express.Router();

export default function loadRoutes(config: PluginConfig<Route>) {
  loadPlugins(config, 'routes', (registerRoutes) => {
    registerRoutes(router);
  });
}

export { router };
