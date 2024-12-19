/* eslint-disable no-nested-ternary */
import { useContext, useEffect } from 'react';
import { ActionIcon, Anchor, Box, Divider, Group, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import NavbarCollection from './NavbarCollection';
import NavbarWebsite from './NavbarWebsite';
import IconButton from './IconButton';
import GenericSkeleton from './GenericSkeleton';
import { CollectionsContext } from '../context/CollectionsContext';
import CollectionsGetter from './CollectionsGetter';
import { WebsiteContext } from '../context/WebsiteContext';

export default function Navbar() {
  const { websiteId } = useParams();
  const location = useLocation();
  const collectionContext = useContext(CollectionsContext);
  const websiteContext = useContext(WebsiteContext);
  const selectingWebsite = ['/', '/websites', '/websites/create'].includes(location.pathname) ||
    location.pathname.includes('/accounts');

  /*
   * Can't use the DataGetter component here as the navbar
   * is re-rendered when the websiteId changes, and hidden
   * on some pages.
   */
  useEffect(() => {
    if (!websiteId) {
      websiteContext.refresh(null);
      collectionContext.refresh(null);
      return;
    }

    websiteContext.refresh(websiteId);
    collectionContext.refresh(websiteId);
  }, [websiteId]);

  return (
    <Stack>
      {selectingWebsite ? (
        <Text c="dimmed">
          Select a website to manage Collections and Media
        </Text>
      ) : (
        !websiteContext.data ? (
          websiteContext.error ? <Text c="red">{websiteContext.error}</Text> :
          <GenericSkeleton skeletonProps={{ h: 24 }} skeletonNum={10} />
        ) : (
          <>
            <NavbarWebsite text={websiteContext.data.name} />
            <Divider />
            <Box>
              <Group justify="space-between">
                <Text fw="bold">Collections</Text>
                <IconButton label="Create Collection" role="SUPERUSER">
                  <ActionIcon component={Link}
                    to={`/websites/${websiteContext.data.id}/collections/create`}>
                    <IconPlus />
                  </ActionIcon>
                </IconButton>
              </Group>
              <CollectionsGetter skeleton={{ skeletonProps: { h: 24 }, skeletonNum: 5 }}>
                {(collections) => (
                  <Stack ml="md" gap={4}>
                    {collections.map((collection) => (
                      <NavbarCollection key={collection.id} websiteId={websiteContext.data.id}
                        collectionId={collection.id} text={collection.name} />
                    ))}
                  </Stack>
                )}
              </CollectionsGetter>
            </Box>
            <Anchor fw="bold" to={`/websites/${websiteId}/media`} component={Link}>Media</Anchor>
          </>
        )
      )}
    </Stack>
  );
}
