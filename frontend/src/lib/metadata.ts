import type { Metadata } from 'next';
import { backendApi } from '@/lib/api';

const DEFAULT_TITLE = 'Magic Rust Template';
const DEFAULT_DESCRIPTION = 'A powerful Rust server website template';

function slugToTitle(slug: string): string {
  const parts = slug.split('/').filter(Boolean);
  const last = parts[parts.length - 1] ?? slug;
  return last
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

type PageMeta = {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageUrl?: string;
  ogImageAlt?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImageUrl?: string;
};

export async function getMetadata(pageSlug: string): Promise<Metadata> {
  const slugForTheme = pageSlug.split('/')[0] ?? pageSlug;
  let siteTitle = DEFAULT_TITLE;
  let siteDescription = DEFAULT_DESCRIPTION;
  let siteImageUrl: string | undefined;
  let pageTitle: string | undefined;
  let pageDescription: string | undefined;
  let pageMeta: PageMeta | undefined;

  try {
    const include = `siteMetadata,pageTheme:${slugForTheme},pageMetadata:${pageSlug}`;
    const res = await fetch(backendApi(`data?include=${encodeURIComponent(include)}`), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    const data = res.ok ? await res.json() : {};
    const site = data.siteMetadata as {
      siteTitle?: string;
      siteDescription?: string;
      siteImageUrl?: string;
      siteImageAlt?: string;
      ogTitle?: string;
      ogDescription?: string;
      ogImageUrl?: string;
      twitterTitle?: string;
      twitterDescription?: string;
      twitterImageUrl?: string;
    } | undefined;
    const page = data.pageTheme as { settings?: { title?: string } } | undefined;
    const pageMetadata = data.pageMetadata as PageMeta | undefined;

    if (site?.siteTitle) siteTitle = site.siteTitle;
    if (site?.siteDescription) siteDescription = site.siteDescription;
    if (site?.siteImageUrl) siteImageUrl = site.siteImageUrl;
    if (page?.settings && typeof page.settings === 'object' && 'title' in page.settings) {
      pageTitle = (page.settings as { title?: string }).title;
    }
    if (pageMetadata?.title) pageTitle = pageMetadata.title;
    if (pageMetadata?.description) pageDescription = pageMetadata.description;
    if (pageMetadata && Object.keys(pageMetadata).length > 0) pageMeta = pageMetadata;
  } catch {
    // use defaults
  }

  const title = pageTitle ?? slugToTitle(pageSlug);
  const fullTitle = title === siteTitle ? siteTitle : `${title} | ${siteTitle}`;
  const description = pageDescription ?? siteDescription;

  const metadata: Metadata = {
    title: fullTitle,
    description,
  };

  const ogTitle = pageMeta?.ogTitle ?? title;
  const ogDescription = pageMeta?.ogDescription ?? description;
  const ogImage = pageMeta?.ogImageUrl ?? siteImageUrl;
  const twitterTitle = pageMeta?.twitterTitle ?? ogTitle;
  const twitterDescription = pageMeta?.twitterDescription ?? ogDescription;
  const twitterImage = pageMeta?.twitterImageUrl ?? ogImage;

  if (ogTitle || ogDescription || ogImage) {
    metadata.openGraph = {
      title: ogTitle ?? fullTitle,
      description: ogDescription,
      ...(ogImage && { images: [{ url: ogImage, alt: pageMeta?.ogImageAlt ?? '' }] }),
    };
  }
  if (twitterTitle || twitterDescription || twitterImage) {
    metadata.twitter = {
      title: twitterTitle ?? fullTitle,
      description: twitterDescription,
      ...(twitterImage && { images: [twitterImage] }),
    };
  }
  if (pageMeta?.keywords) {
    metadata.keywords = pageMeta.keywords;
  }

  return metadata;
}
