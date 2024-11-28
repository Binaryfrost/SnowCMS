import DefaultHeading, { type Level } from '@tiptap/extension-heading';
import { mergeAttributes } from '@tiptap/react';
import { EditorState } from '@tiptap/pm/state';
import slug from 'slug';
import { randomHex } from '../../util';

function getAttributesWithId(state: EditorState, attributes) {
  const node = state.selection.$head.parent;
  const content = node.textContent;
  const id = {
    random: randomHex(6),
    slug: slug(content, { fallback: false }).substring(0, 40)
  };

  return node.type.name === 'heading' ? attributes :
    mergeAttributes(attributes, { id });
}

const Heading = DefaultHeading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        renderHTML(attributes) {
          const { id } = attributes;
          if (!id) return {};
          return {
            id: typeof id === 'object' ? `h-${id.random}-${id.slug}` : id
          };
        }
      },
    };
  },
  parseHTML() {
    return this.options.levels
      .map((level: Level) => ({
        tag: `h${level}`,
        getAttrs(node) {
          return {
            level,
            id: node.getAttribute('id')
          };
        },
      }));
  },
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level = hasLevel
      ? node.attrs.level
      : this.options.levels[0];

    return [`h${level}`, mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
  addCommands() {
    return {
      setHeading: (attributes) => ({ state, commands }) => {
        if (!this.options.levels.includes(attributes.level)) {
          return false;
        }

        return commands.setNode(this.name, getAttributesWithId(state, attributes));
      },
      toggleHeading: (attributes) => ({ state, commands }) => {
        if (!this.options.levels.includes(attributes.level)) {
          return false;
        }

        return commands.toggleNode(this.name, 'paragraph', getAttributesWithId(state, attributes));
      },
    };
  }
});

export default Heading;
