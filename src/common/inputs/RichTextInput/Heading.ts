import DefaultHeading from '@tiptap/extension-heading';
import type { DOMOutputSpec } from '@tiptap/pm/model';
import { mergeAttributes } from '@tiptap/react';
import { Mutable } from 'utility-types';

const Heading = DefaultHeading.extend({
  renderHTML({ node, HTMLAttributes }) {
    const hasLevel = this.options.levels.includes(node.attrs.level);
    const level = hasLevel
      ? node.attrs.level
      : this.options.levels[0];

    const html: Mutable<DOMOutputSpec> = [
      `h${level}`,
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      node.textContent
    ];

    if (node.attrs.id) {
      html.push(['a', { href: `#${node.attrs.id}`, class: 'heading-anchor-link' }]);
    }

    return html;
  }
});

export default Heading;
