import { ActionIcon, Box, Group, Text, Tooltip } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconSwitch } from '@tabler/icons-react';
import ButtonTooltip from './ButtonTooltip';

interface Props {
  text: string
}

export default function NavbarWebsite({ text }: Props) {
  return (
    <Box>
      <Group>
        <Text fw="bold" maw={200} truncate="end">Website:&nbsp;
          <Tooltip label={text} inline>
            <Text inherit component="span">{text}</Text>
          </Tooltip>
        </Text>
        <ButtonTooltip label="Change Website">
          <ActionIcon component={Link} to="/">
            <IconSwitch />
          </ActionIcon>
        </ButtonTooltip>
      </Group>
    </Box>
  );
}
