import { useParams } from 'react-router-dom';
import { Box, Checkbox, Input as MantineInput, NumberInput, Stack, Text } from '@mantine/core';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { modals } from '@mantine/modals';
import { JSONContent, mergeAttributes, useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Youtube from '@tiptap/extension-youtube';
import { generateHTML } from '@tiptap/html';
import { all, createLowlight } from 'lowlight';
// @ts-ignore
import UniqueId from 'tiptap-unique-id';
import { IconAlertSquare, IconArrowMerge, IconArrowsSplit, IconBrandYoutube, IconColumnInsertLeft,
  IconColumnInsertRight, IconColumnRemove, IconLinkMinus, IconPhoto, IconRowInsertBottom,
  IconRowInsertTop, IconRowRemove, IconTable, IconTableColumn, IconTableOff,
  IconTableRow, IconVideo } from '@tabler/icons-react';
import type { Input } from '../InputRegistry';
import { randomHex } from '../util';
import { SELECT_MEDIA_MODAL_ID, showSelectMediaModal } from '../../client/util/modals';
import { showChangeIdModal } from './RichTextInput/ChangeIdModal';
import { showChangeLinkRelModal } from './RichTextInput/ChangeLinkRelModal';
import Heading from './RichTextInput/Heading';
import Video from './RichTextInput/Video';

import './RichTextInput/RichTextInput.css';
import { showYoutubeModal } from './RichTextInput/YoutubeModal';
import { showVideoModal } from './RichTextInput/VideoModal';
import ExpressError from '../ExpressError';
import { showAlertModal } from './RichTextInput/AlertModal';
import Alert, { AlertProps } from './RichTextInput/Alert';
import { useInputValidator, useSettingsHandler } from './hooks';

interface RichTextInputSettings {
  maxLength: number
  required: boolean
}

const lowlight = createLowlight(all);

const extensions = [
  StarterKit.configure({
    codeBlock: false,
    heading: false
  }),
  Heading,
  UniqueId.configure({
    attributeName: 'id',
    types: ['heading'],
    createId: () => `h-${randomHex(8)}`
  }),
  Underline,
  Link,
  Superscript,
  SubScript,
  Highlight,
  TextAlign.configure({
    types: ['heading', 'paragraph']
  }),
  Image.configure({
    HTMLAttributes: {
      loading: 'lazy'
    }
  }),
  CodeBlockLowlight.configure({
    lowlight
  }),
  Table,
  TableRow,
  TableHeader,
  TableCell,
  Youtube.configure({
    HTMLAttributes: {
      loading: 'lazy'
    }
  }),
  Video,
  Alert
];

const input: Input<JSONContent, RichTextInputSettings> = {
  id: 'rich-text',
  name: 'Rich Text',

  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),

  renderInput: ({
    name, description, value, settings, onChange, registerValidator, unregisterValidator
  }) => {
    const { websiteId } = useParams();

    const editor = useEditor({
      extensions,
      content: value || '',
      onUpdate: (update) => onChange(update.editor.getJSON())
    });

    const error = useInputValidator(
      (v) => {
        const { length } = editor.getText();

        if (settings.required && length === 0) {
          return `${name} is required`;
        }
  
        if (settings.maxLength > 0 && length > settings.maxLength) {
          return `Max length is ${settings.maxLength}`;
        }
  
        return null;
      },
      registerValidator,
      unregisterValidator
    );

    return (
      <Box>
        <MantineInput.Label required={settings.required}>{name}</MantineInput.Label>
        {description && (
          <MantineInput.Description>{description}</MantineInput.Description>
        )}

        <RichTextEditor editor={editor} bd={error && '1px solid var(--mantine-color-error)'}>
          <RichTextEditor.Toolbar sticky stickyOffset={60}>
            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Bold />
              <RichTextEditor.Italic />
              <RichTextEditor.Underline />
              <RichTextEditor.Strikethrough />
              <RichTextEditor.ClearFormatting />
              <RichTextEditor.Highlight />
              <RichTextEditor.Code />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.H1 />
              <RichTextEditor.H2 />
              <RichTextEditor.H3 />
              <RichTextEditor.H4 />
              <RichTextEditor.Control title="Change ID" aria-label="Change ID"
                disabled={!editor.isActive('heading')} onClick={() => {
                  const node = editor.state.selection.$head.parent;
                  showChangeIdModal({
                    currentId: node.attrs.id,
                    close(newId) {
                      if (!newId) return;
                      editor.commands.updateAttributes('heading', {
                        id: newId
                      });
                    }
                  });
                }}>
                <Text w="1rem" h="1rem" lh={0.8} fw="lighter">ID</Text>
              </RichTextEditor.Control>
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Blockquote />
              <RichTextEditor.Hr />
              <RichTextEditor.BulletList />
              <RichTextEditor.OrderedList />
              <RichTextEditor.Subscript />
              <RichTextEditor.Superscript />
              <RichTextEditor.Control onClick={() => {
                const alertAttrs = editor.getAttributes('alert');

                showAlertModal({
                  current: alertAttrs as AlertProps,
                  close: (alert) => {
                    if (!alert) return;
                    editor.commands.insertContent({
                      type: 'alert',
                      attrs: alert
                    });
                  }
                });
              }}
                title="Insert Alert" aria-label="Insert Alert">
                <IconAlertSquare stroke={1.5} size="1rem" />
              </RichTextEditor.Control>
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignJustify />
              <RichTextEditor.AlignRight />
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
              <RichTextEditor.Control disabled={!editor.isActive('link')} onClick={() => {
                const linkAttrs = editor.getAttributes('link');
                const currentRelValues = editor.getAttributes('link').rel?.split(' ') || [];

                showChangeLinkRelModal({
                  current: {
                    nofollow: currentRelValues.includes('nofollow'),
                    noreferrer: currentRelValues.includes('noreferrer'),
                    sponsored: currentRelValues.includes('sponsored'),
                    ugc: currentRelValues.includes('ugc')
                  },
                  close: (rel) => {
                    if (!rel) return;
                    const relValues = ['noopener'];

                    Object.entries(rel).forEach(([key, enabled]) => {
                      if (enabled) {
                        relValues.push(key);
                      }
                    });

                    const { href, ...attrs } = linkAttrs;

                    editor.chain().focus().extendMarkRange('link')
                      .setLink({
                        href,
                        ...mergeAttributes(attrs, {
                          rel: relValues.join(' '),
                        })
                      })
                      .run();
                  }
                });
              }} title="Change Link Relationship" aria-label="Change Link Relationship">
                <IconLinkMinus stroke={1.5} size="1rem" />
              </RichTextEditor.Control>
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Control onClick={() => showSelectMediaModal({
                websiteId,
                select: (file) => {
                  modals.close(SELECT_MEDIA_MODAL_ID);
                  if (file.fileType.startsWith('image/')) {
                    editor.commands.setImage({
                      src: file.url
                    });
                  } else {
                    editor.commands.insertContent({
                      type: 'text',
                      text: 'Download file',
                      marks: [{
                        type: 'link',
                        attrs: {
                          href: file.url,
                          target: '_blank'
                        }
                      }]
                    });
                  }
                }
              })} title="Insert File" aria-label="Insert File">
                <IconPhoto stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control onClick={() => showYoutubeModal({
                close(video) {
                  if (!video) return;
                  editor.commands.setYoutubeVideo({
                    src: video.src,
                    height: video.height,
                    width: video.width
                  });
                }
              })} title="Insert YouTube Video" aria-label="Insert YouTube Video">
                <IconBrandYoutube stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control onClick={() => showVideoModal({
                close(video) {
                  if (!video) return;
                  editor.commands.insertContent({
                    type: 'video',
                    attrs: video
                  });
                }
              })} title="Insert Video" aria-label="Insert Video">
                <IconVideo stroke={1.5} size="1rem" />
              </RichTextEditor.Control>
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Control title="Insert Table" aria-label="Insert Table"
                disabled={editor.isActive('table')}
                onClick={() => {
                  editor.chain().focus()
                    .insertTable({
                      rows: 3,
                      cols: 3,
                      withHeaderRow: true
                    })
                    .run();
                }}>
                <IconTable stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Remove Table" aria-label="Remove Table"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().deleteTable().run()}>
                <IconTableOff stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Insert Column Before" aria-label="Insert Column Before"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().addColumnBefore().run()}>
                <IconColumnInsertLeft stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Insert Column After" aria-label="Insert Column After"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().addColumnAfter().run()}>
                <IconColumnInsertRight stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Remove Column" aria-label="Remove Column"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().deleteColumn().run()}>
                <IconColumnRemove stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Insert Row Before" aria-label="Insert Row Before"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().addRowBefore().run()}>
                <IconRowInsertTop stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Insert Row After" aria-label="Insert Row After"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().addRowAfter().run()}>
                <IconRowInsertBottom stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Remove Row" aria-label="Remove Row"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().deleteRow().run()}>
                <IconRowRemove stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Toggle Header Row" aria-label="Toggle Header Row"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
                <IconTableRow stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Toggle Header Column" aria-label="Toggle Header Column"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().toggleHeaderColumn().run()}>
                <IconTableColumn stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Merge Cells" aria-label="Merge Cells"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().mergeCells().run()}>
                <IconArrowMerge stroke={1.5} size="1rem" />
              </RichTextEditor.Control>

              <RichTextEditor.Control title="Split Cell" aria-label="Split Cell"
                disabled={!editor.isActive('table')}
                onClick={() => editor.chain().focus().splitCell().run()}>
                <IconArrowsSplit stroke={1.5} size="1rem" />
              </RichTextEditor.Control>
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.Undo />
              <RichTextEditor.Redo />
            </RichTextEditor.ControlsGroup>
          </RichTextEditor.Toolbar>

          <RichTextEditor.Content />
        </RichTextEditor>
        {error && <MantineInput.Error>{error}</MantineInput.Error>}
      </Box>
    );
  },

  defaultSettings: {
    maxLength: 0,
    required: true
  },

  renderSettings: ({ settings, onChange, registerValidator, unregisterValidator }) => {
    const setSetting = useSettingsHandler(settings, onChange);

    const errors = useInputValidator(
      (v) => ({
        maxLength: v.maxLength < 0 ? 'Max length must be positive' : null
      }),
      registerValidator,
      unregisterValidator
    );

    return (
      <Stack>
        <NumberInput label="Max Length" allowDecimal={false}
          description="Set to 0 to disable length limit" required error={errors?.maxLength}
          value={settings.maxLength} onChange={(v: number) => setSetting('maxLength', v)} />
        <Checkbox label="Required" checked={settings.required}
          onChange={(e) => setSetting('required', e.target.checked)} />
      </Stack>
    );
  },

  /*
   * It would be great to check the max length here, but it doesn't look
   * like Tiptap provides a server-side getText() API.
   */
  validate: (stringifiedValue, deserialize, settings) => {
    if (!stringifiedValue) {
      if (settings.required) {
        throw new ExpressError('Required Rich Text Input does not have a value');
      }
      return;
    }

    const value = deserialize(stringifiedValue);
    if (typeof value !== 'object' || Array.isArray(value)) {
      throw new ExpressError('Invalid Rich Text Input data');
    }
  },

  validateSettings: (settings) => {
    if (typeof settings.maxLength !== 'number') {
      throw new ExpressError('Max Length must be a number');
    }

    if (settings.maxLength < 0) {
      throw new ExpressError('Max Length cannot be negative');
    }

    if (typeof settings.required !== 'boolean') {
      throw new ExpressError('Required must be a boolean');
    }

    if (settings.maxLength >= 10) {
      throw new ExpressError('test');
    }
  },

  renderHtml: (value) => generateHTML(value, extensions)
};

export default input;
