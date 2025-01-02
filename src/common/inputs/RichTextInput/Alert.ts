import { Node } from '@tiptap/react';

export interface AlertProps {
  bg: string
  color: string
  text: string
}

const Alert = Node.create({
  name: 'alert',
  group: 'block',
  inline: false,

  addAttributes() {
    return {
      bg: '',
      color: '',
      text: ''
    };
  },
  renderHTML({ HTMLAttributes }) {
    const attrs = {
      'data-alert': '',
      style: {
        backgroundColor: HTMLAttributes.bg,
        color: HTMLAttributes.color,
        padding: '1rem',
        borderRadius: '0.25rem'
      }
    };

    return ['div', attrs, HTMLAttributes.text];
  },
  parseHTML() {
    return [{
      tag: 'div[data-alert]'
    }];
  },
  addNodeView() {
    return ({ node }) => {
      const theme = document.querySelector<HTMLElement>('[data-mantine-color-scheme]')
        .dataset.mantineColorScheme;
      const themeBorderColors = {
        dark: 'var(--mantine-color-dark-4)',
        light: 'var(--mantine-color-gray-4)'
      };

      const container = document.createElement('div');
      container.style.border = `1px solid ${themeBorderColors[theme]}`;
      container.style.width = 'fit-content';
      container.style.padding = '0.5rem';
      container.style.borderRadius = '0.5rem';

      const content = document.createElement('div');
      content.style.backgroundColor = node.attrs.bg;
      content.style.color = node.attrs.color;
      content.style.padding = '1rem';
      content.style.borderRadius = '0.25rem';
      content.innerText = node.attrs.text;

      container.append(content);

      return {
        dom: container,
        contentDOM: content
      };
    };
  }
});

export default Alert;
