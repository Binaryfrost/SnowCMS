import { Node } from '@tiptap/react';

export interface VideoProps {
  src: string
  height: number
  width: number
  autoplay: boolean
  controls: boolean
  loop: boolean
}

const Video = Node.create({
  name: 'video',
  group: 'block',
  inline: false,

  addAttributes() {
    return {
      src: '',
      autoplay: false,
      controls: false,
      loop: false,
      height: null,
      width: null
    };
  },
  renderHTML({ HTMLAttributes }) {
    const attrs = {};

    Object.entries(HTMLAttributes).forEach(([key, value]) => {
      if (value) attrs[key] = value;
    });

    return ['video', attrs];
  },
  parseHTML() {
    return [{
      tag: 'video'
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
      container.style.borderRadius = '8px';

      const content = document.createElement('video');
      content.src = node.attrs.src;
      content.controls = true;
      container.append(content);

      const videoInfo = document.createElement('div');
      videoInfo.innerText = `Auto Play: ${node.attrs.autoplay} | ` +
        `Controls: ${node.attrs.controls} | Loop: ${node.attrs.loop} | ` +
        `Height: ${node.attrs.height || 'unset'} | Width: ${node.attrs.width || 'unset'}`;
      container.appendChild(videoInfo);

      return {
        dom: container,
        contentDOM: content
      };
    };
  }
});

export default Video;
