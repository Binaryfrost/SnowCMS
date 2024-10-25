import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconSwitch } from '@tabler/icons-react';
import IconButton from './IconButton';

interface Props {
  text: string
}

export default function NavbarWebsite({ text }: Props) {
  return (
    <Box>
      <Group justify="space-between">
        <Text fw="bold" maw={200} truncate="end">Website:&nbsp;
          <Tooltip label={text} inline position="top-start">
            <Text inherit component="span">{text}</Text>
          </Tooltip>
        </Text>
        <IconButton label="Change Website">
          <ActionIcon component={Link} to="/websites">
            <IconSwitch />
          </ActionIcon>
        </IconButton>
      </Group>
    </Box>
  );
}
