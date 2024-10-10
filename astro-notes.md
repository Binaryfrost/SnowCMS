## Workaround for https://github.com/withastro/astro/issues/10824

```js
---
import { getImage } from 'astro:assets';

const html = await (await fetch('https://framed-app.com/')).text();
// This replace is optional, it's just here due to the HTML of the fetched site
let embed = html.replace(/^.*<body>/gs, '')
  .replace(/<\/body.*/gs, '')
  .replaceAll(/src="\//g, 'src="https://framed-app.com/');

const images = embed.matchAll(/<img[^>]*src="([^"]*)"/g);
for (const image of images) {
  const fullMatch = image[0];
  const imageUrl = image[1];

  const optimizedImage = await getImage({
    src: imageUrl,
    inferSize: true
  });

  // TODO: Add width and height to prevent CLS

  const fullMatchReplaced = fullMatch.replace(imageUrl, optimizedImage.src);

  embed = embed.replace(fullMatch, fullMatchReplaced);
}
---
  
<Fragment set:html={embed} />
```