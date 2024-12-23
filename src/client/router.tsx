import { Navigate, createBrowserRouter } from 'react-router-dom';
import ErrorPage from './ErrorPage';
import Refresh from './pages/Refresh';
import Logout from './pages/Logout';

export const router = createBrowserRouter([{
  children: [{
    path: '/',
    element: <Navigate to="/websites" />
  }, {
    path: '/refresh',
    element: <Refresh />
  }, {
    path: '/login',
    lazy: () => import('./pages/Login')
  }, {
    path: '/logout',
    element: <Logout />
  }]
}, {
  lazy: () => import('./RootLayout'),
  errorElement: <ErrorPage />,
  children: [{
    path: '/websites',
    lazy: () => import('./pages/website/Websites')
  }, {
    path: '/websites/create',
    lazy: () => import('./pages/website/CreateWebsite')
  }, {
    path: '/websites/:websiteId/settings',
    lazy: () => import('./pages/website/EditWebsite')
  }, {
    path: '/websites/:websiteId/collections',
    lazy: () => import('./pages/collections/Collections')
  }, {
    path: '/websites/:websiteId/collections/create',
    lazy: () => import('./pages/collections/CreateCollection')
  }, {
    path: '/websites/:websiteId/collections/:collectionId/settings',
    lazy: () => import('./pages/collections/EditCollection')
  }, {
    path: '/websites/:websiteId/collections/:collectionId/entries',
    lazy: () => import('./pages/collection-entries/CollectionEntries')
  }, {
    path: '/websites/:websiteId/collections/:collectionId/entries/create',
    lazy: () => import('./pages/collection-entries/CreateCollectionEntry')
  }, {
    path: '/websites/:websiteId/collections/:collectionId/entries/:entryId',
    lazy: () => import('./pages/collection-entries/EditCollectionEntry')
  }, {
    path: '/websites/:websiteId/media',
    lazy: () => import('./pages/media/Media')
  }, {
    path: '/accounts',
    lazy: () => import('./pages/accounts/Accounts')
  }, {
    path: '/accounts/create',
    lazy: () => import('./pages/accounts/CreateAccount')
  }, {
    path: '/accounts/:accountId/settings',
    lazy: () => import('./pages/accounts/EditAccount')
  }, {
    path: '/accounts/:accountId/settings/keys/create',
    lazy: () => import('./pages/accounts/keys/CreateKey')
  }, {
    path: '/accounts/:accountId/settings/keys/:keyId/settings',
    lazy: () => import('./pages/accounts/keys/EditKey')
  }]
}]);
