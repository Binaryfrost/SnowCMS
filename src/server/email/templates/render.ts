import ejs from 'ejs';
import path from 'path';
import { exists } from '../../../util';
import mjml2html from 'mjml';
import { getConfig } from '../../config/config';
import { ValuesType } from 'utility-types';

export interface TemplateDataBase {
  email: string
}

const EMAIL_VARIANTS = ['text', 'html'] as const;
export type EmailVariants = ValuesType<typeof EMAIL_VARIANTS>;

export interface RenderedTemplates {
  text: string
  html: string
}

function getLogoUrl() {
  const { instanceRootUrl } = getConfig();

  let url = instanceRootUrl;
  if (!url.endsWith('/')) {
    url += '/';
  }

  url += 'api/assets/email-logo';

  return url;
}

async function renderIntoBaseTemplate(body: string, email: string) {
  const file = path.join('email', '_base.ejs');

  return await ejs.renderFile(file, {
    body,
    email,
    logo_url: getLogoUrl()
  }, {
    async: true
  });
}

async function renderEjsTemplateFile<T extends TemplateDataBase>(file: string, data: T): Promise<[string, string]> {
  const render = async (variant: EmailVariants): Promise<string> => {
    return ejs.renderFile(file, {
      variant,
      ...data
    }, {
      async: true
    })
  };

  // @ts-ignore Length information gets lost when using .map (https://github.com/microsoft/TypeScript/issues/29841)
  return Promise.all(EMAIL_VARIANTS.map(render));
}

export async function renderEmailTemplate<T extends TemplateDataBase>(template: string, data: T): Promise<RenderedTemplates> {
  const file = path.join('email', `${template}.ejs`);
  if (!await exists(file)) {
    throw new Error(`Email template ${template} does not exist`);
  }

  const [text, html] = await renderEjsTemplateFile(file, data);

  return {
    text: text
      // Strip unnecessary whitespace while keeping internal newlines which ejs's rmWhitespace strips
      .replaceAll(/^ +/gm, '')
      .replaceAll(/^\n+/g, '')
      .replaceAll(/\n+$/g, ''),
    html: await (async () => {
      const email = await renderIntoBaseTemplate(
        html,
        data.email
      );
  
      const renderedEmail = mjml2html(email);
  
      if (renderedEmail.errors.length != 0) {
        throw new Error(`Failed to render email: ${JSON.stringify(renderedEmail.errors)}`);
      }
  
      return renderedEmail.html;
    })()
  };
}

