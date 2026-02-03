import { createRoute } from '@granite-js/react-native';
import UnitConverter from '../src/components/UnitConverter';

export const Route = createRoute('/', {
  validateParams: (params) => params,
  component: HomePage,
});

export function HomePage() {
  return <UnitConverter />;
}
