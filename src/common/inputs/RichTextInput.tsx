import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Checkbox, Input as MantineInput, NumberInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { RichTextEditor, Link } from '@mantine/tiptap';
import { modals } from '@mantine/modals';
import { Editor, JSONContent, useEditor } from '@tiptap/react';
import Highlight from '@tiptap/extension-highlight';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Superscript from '@tiptap/extension-superscript';
import SubScript from '@tiptap/extension-subscript';
import Image from '@tiptap/extension-image';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import { generateHTML } from '@tiptap/html';
import { all, createLowlight } from 'lowlight';
import { IconPhoto } from '@tabler/icons-react';
import { type Input } from '../InputRegistry';
import { SELECT_MEDIA_MODAL_ID, showSelectMediaModal } from '../../client/util/modals';
import Heading from './RichTextInput/Heading';

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
  })
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
              <RichTextEditor.Link />
              <RichTextEditor.Unlink />
              <RichTextEditor.Control onClick={() => showSelectMediaModal({
                websiteId,
                select: (file) => {
                  modals.close(SELECT_MEDIA_MODAL_ID);
                  editor.commands.setImage({
                    src: file.url
                  });
                }
              })} title="Add Image" aria-label="Add Image">
                <IconPhoto stroke={1.5} size="1rem" />
              </RichTextEditor.Control>
            </RichTextEditor.ControlsGroup>

            <RichTextEditor.ControlsGroup>
              <RichTextEditor.AlignLeft />
              <RichTextEditor.AlignCenter />
              <RichTextEditor.AlignJustify />
              <RichTextEditor.AlignRight />
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

  renderHtml: (value) => generateHTML(value, extensions)
};

export default input;
