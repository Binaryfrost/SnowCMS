/* eslint-disable no-nested-ternary */
import { useContext, useEffect, useState } from 'react';
import { ActionIcon, Anchor, Box, Divider, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconPlus } from '@tabler/icons-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import NavbarCollection from './NavbarCollection';
import NavbarWebsite from './NavbarWebsite';
import IconButton from './IconButton';
import { Website } from '../../common/types/Website';
import GenericSkeleton from './GenericSkeleton';
import { get } from '../util/api';
import { CollectionContext } from '../context/CollectionsContext';

export default function Navbar() {
  const { websiteId } = useParams();
  const location = useLocation();
  const [website, setWebsite] = useState<Website>(null);
  const [error, setError] = useState(null);
  const collectionContext = useContext(CollectionContext);
  const selectingWebsite = ['/', '/websites', '/websites/create'].includes(location.pathname);

  /*
   * Can't use the DataGetter component here as the navbar
   * is re-rendered when the websiteId changes, and hidden
   * on some pages.
   */
  useEffect(() => {
    setError(null);

    if (!websiteId) {
      setWebsite(null);
      collectionContext.refresh(null);
      return;
    }

    get<Website>(`/api/websites/${websiteId}`).then((resp) => {
      if (resp.status !== 200) {
        const message = `Failed to load website data: ${resp.body.error || 'An error occurred'}`;
        notifications.show({
          message,
          color: 'red'
        });

        setError(message);

        return;
      }

      setWebsite(resp.body);
      collectionContext.refresh(resp.body.id);
    });
  }, [websiteId]);

  return (
    <Stack>
      {selectingWebsite ? (
        <Text c="dimmed">
          Select a website on the right
        </Text>
      ) : (
        !website ? (
          error ? <Text c="red">{error}</Text> :
          <GenericSkeleton skeletonProps={{ h: 24 }} skeletonNum={10} />
        ) : (
          <>
            <NavbarWebsite text={website.name} />
            <Divider />
            <Box>
              <Group>
                <Text fw="bold">Collections</Text>
                <IconButton label="Create Collection" role="SUPERUSER">
                  <ActionIcon component={Link} to={`/websites/${website.id}/collections/create`}>
                    <IconPlus />
                  </ActionIcon>
                </IconButton>
              </Group>
              {collectionContext.loading ? (
                <GenericSkeleton skeletonProps={{ h: 24 }} skeletonNum={5} />
              ) : (
                collectionContext.error ? <Text c="red">{collectionContext.error}</Text> : (
                  collectionContext.collections.length === 0 ? (
                    <Text>No Collections exist, or you do not have access to any</Text>
                  ) : (
                    <Stack ml="md" gap={4}>
                      {collectionContext.collections.map((collection) => (
                        <NavbarCollection key={collection.id} websiteId={website.id}
                          collectionId={collection.id} text={collection.name} />
                      ))}
                    </Stack>
                  )
                )
              )}
            </Box>
            <Anchor fw="bold" to="#" component={Link}>Media</Anchor>
          </>
        )
      )}
    </Stack>
  );
}
