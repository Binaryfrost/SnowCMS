import { IconPlus } from '@tabler/icons-react';
import Page from '../components/Page';
import HeaderWithAddButton from '../components/HeaderWithAddButton';

export function Component() {
  return (
    <Page title="Websites">
      <HeaderWithAddButton titleProps={{
        children: 'Websites'
      }} actionIconProps={{
        children: (
          <IconPlus />
        )
      }} tooltipLabel="Add Website" />
    </Page>
  );
}
