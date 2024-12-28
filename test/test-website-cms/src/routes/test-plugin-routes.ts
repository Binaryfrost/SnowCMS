import { User } from '../../../../src/common/types/User';
import { defineRoutePlugin } from '../../../../src/config';
import { ExpressError } from '../../../../src/lib';
import { db } from '../../../../src/lib/server';
import handleAccessControl from '../../../../src/server/handleAccessControl';
import { asyncRouteFix } from '../../../../src/server/util';

export default defineRoutePlugin({
  name: 'test-plugin',
  plugin: ({ logger }) => (router) => {
    logger.log('Registering routes');

    router.get('/custom-route', (req, res) => {
      console.log(req.user);
      handleAccessControl(req.user, 'USER');

      res.json({
        message: 'Only users with the USER role and higher can access this route'
      });
    });

    router.get('/public', (req, res) => {
      res.json({
        message: 'Everyone, including unauthenticated users can access this route'
      });
    });

    router.get('/async', asyncRouteFix(async (req, res) => {
      if (req.query.error) {
        throw new ExpressError('Error');
      }

      res.json({
        message: 'This public async route can throw an error'
      });
    }));

    router.get('/users', asyncRouteFix(async (req, res) => {
      const users = await db()<User>('users')
        .select('id');

      res.json({
        message: 'You can also access the database in routes',
        users
      });
    }));
  }
});
