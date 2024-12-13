import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Checkbox, Input as MantineInput, NumberInput, Stack, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { modals } from '@mantine/modals';
import { Editor, JSONContent, mergeAttributes, useEditor } from '@tiptap/react';
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
import { IconArrowMerge, IconArrowsSplit, IconBrandYoutube, IconColumnInsertLeft,
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

interface TextInputSettings {
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
  Youtube,
  Video
];

const input: Input<JSONContent, TextInputSettings> = {
  id: 'rich-text',
  name: 'Rich Text',

  serialize: (data) => JSON.stringify(data),
  deserialize: (data) => JSON.parse(data),

  renderInput: () => forwardRef((props, ref) => {
    const { websiteId } = useParams();
    const [error, setError] = useState(null);

    function validate(e: Editor) {
      const { length } = e.getText();

      if (props.settings.required && length === 0) {
        return `${props.name} is required`;
      }

      if (props.settings.maxLength > 0 && length > props.settings.maxLength) {
        return `Max length is ${props.settings.maxLength}`;
      }

      return null;
    }

    function inputValidation(e: Editor) {
      const validateError = validate(e);

      if (validateError) {
        setError(validateError);
        return validateError;
      }

      if (error) {
        setError(null);
      }

      return null;
    }

    const editor = useEditor({
      extensions,
      content: props.value || '',
      onUpdate: (update) => inputValidation(update.editor)
    });

    useImperativeHandle(ref, () => ({
      getValues: () => editor.getJSON(),
      hasError: () => !!inputValidation(editor)
    }));

    return (
      <Box>
        <MantineInput.Label required={props.settings.required}>{props.name}</MantineInput.Label>
        {props.description && (
          <MantineInput.Description>{props.description}</MantineInput.Description>
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
                  console.log(video);
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
  }),

  serializeSettings: (data) => JSON.stringify(data),
  deserializeSettings: (data) => JSON.parse(data),

  renderSettings: () => forwardRef((props, ref) => {
    const form = useForm({
      mode: 'uncontrolled',
      initialValues: {
        maxLength: props.settings?.maxLength || 0,
        required: props.settings?.required ?? true
      },
      validateInputOnChange: true,
      validate: (values) => ({
        maxLength: values.maxLength < 0 ? 'Max length must be positive' : null
      }),
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getValues(),
      hasError: () => form.validate().hasErrors
    }));

    useEffect(() => {
      form.validate();
    }, []);

    return (
      <Stack>
        <NumberInput label="Max Length" allowDecimal={false}
          description="Set to 0 to disable length limit" required
          {...form.getInputProps('maxLength')} key={form.key('maxLength')} />
        <Checkbox label="Required" {...form.getInputProps('required', { type: 'checkbox' })}
          key={form.key('required')} />
      </Stack>
    );
  }),

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

  renderHtml: (value) => generateHTML(value, extensions)
};

export default input;
