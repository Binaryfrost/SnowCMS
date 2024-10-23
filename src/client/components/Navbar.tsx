import { ActionIcon, Anchor, Box, Divider, Group, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link, useLocation } from 'react-router-dom';
import NavbarCollection from './NavbarCollection';
import NavbarWebsite from './NavbarWebsite';
import ButtonTooltip from './ButtonTooltip';

export default function Navbar() {
  const location = useLocation();
  const selectingWebsite = location.pathname === '/';

  return (
    <Stack>
      {selectingWebsite ? (
        <Text c="dimmed">
          Select a website on the right
        </Text>
      ) : (
        <>
          <NavbarWebsite text="Test Website 1234567890123" />
          <Divider />
          <Box>
            <Group>
              <Text fw="bold">Collections</Text>
              <ButtonTooltip label="Add Collection">
                <ActionIcon>
                  <IconPlus />
                </ActionIcon>
              </ButtonTooltip>
            </Group>

            <Stack ml="md" gap={4}>
              <NavbarCollection collectionId="1234" text="Collection 1" />
              <NavbarCollection collectionId="1234" text="Collection 2" />
              <NavbarCollection collectionId="1234" text="Collection 3" />
              <NavbarCollection collectionId="1234" text="Collection 4 with a really long name" />
              <NavbarCollection collectionId="1234" text="..." />
            </Stack>
          </Box>
          <Anchor fw="bold" to="#" component={Link}>Media</Anchor>
        </>
      )}
    </Stack>
  );
}
