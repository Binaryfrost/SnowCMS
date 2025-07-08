import DefaultYoutube, { type YoutubeOptions } from '@tiptap/extension-youtube';

type RenderHtmlReturnType = [
  'div',
  { 'data-youtube-video': '' },
  [
    'iframe',
    Omit<
      YoutubeOptions, 'addPasteHandler' | 'controls' | 'HTMLAttributes' | 'inline' | 'nocookie'
    > & Record<string, any>
  ],
]

const Youtube = DefaultYoutube.extend({
  renderHTML({ node, HTMLAttributes }) {
    const html: RenderHtmlReturnType = DefaultYoutube.config.renderHTML.bind(this)({
      node,
      HTMLAttributes
    });

    const attrs = html[2][1];
    attrs.style = Object.entries({
      'max-width': '100%',
      height: 'auto',
      'aspect-ratio': `${attrs.width} / ${attrs.height}`
    }).map(([k, v]) => `${k}: ${v}`)
    .join(';')


    return html;
  }
});

export default Youtube;
