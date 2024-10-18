import { createBrowserRouter } from 'react-router-dom';
import ErrorPage from './ErrorPage';

export const router = createBrowserRouter([{
  lazy: () => import('./RootLayout'),
  errorElement: <ErrorPage />,
  children: [

  ]
}]);
