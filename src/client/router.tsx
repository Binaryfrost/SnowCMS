import { Navigate, createBrowserRouter } from 'react-router-dom';
import ErrorPage from './ErrorPage';
import Refresh from './pages/Refresh';
import Logout from './pages/Logout';

export const router = createBrowserRouter([{
  lazy: () => import('./RootLayout'),
  errorElement: <ErrorPage />,
  children: [{
    path: '/',
    element: <Navigate to="/websites" />
  }, {
    path: '/refresh',
    element: <Refresh />
  }, {
    path: '/logout',
    element: <Logout />
  }, {
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
  }]
}]);
