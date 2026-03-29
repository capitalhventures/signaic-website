import { XMLParser } from "fast-xml-parser";

export interface RSSFeedItem {
  title: string;
  description: string | null;
  url: string;
  author: string | null;
  publishedAt: string;
  tags: string[];
}

interface RSSChannel {
  item?: RSSRawItem | RSSRawItem[];
  title?: string;
}

interface RSSRawItem {
  title?: string;
  description?: string;
  link?: string;
  pubDate?: string;
  "dc:creator"?: string;
  author?: string;
  category?: string | string[] | { "#text": string }[] | { "#text": string };
  guid?: string | { "#text": string };
}

interface AtomEntry {
  title?: string | { "#text": string };
  summary?: string;
  content?: string | { "#text": string };
  link?: { "@_href": string } | { "@_href": string }[];
  published?: string;
  updated?: string;
  author?: { name?: string } | { name?: string }[];
  category?: { "@_term": string } | { "@_term": string }[];
  id?: string;
}

interface AtomFeed {
  entry?: AtomEntry | AtomEntry[];
}

/**
 * Fetches and parses an RSS or Atom feed, returning normalized items.
 */
export async function parseRSSFeed(
  feedUrl: string,
  sourceName: string
): Promise<RSSFeedItem[]> {
  const response = await fetch(feedUrl, {
    headers: {
      "User-Agent": "Signaic/1.0 (https://signaic.com)",
      Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
    },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${sourceName} feed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    textNodeName: "#text",
    processEntities: false,
  });

  const parsed = parser.parse(xml);

  // Detect feed format: RSS 2.0 or Atom
  if (parsed.rss?.channel) {
    return parseRSS2(parsed.rss.channel);
  } else if (parsed.feed) {
    return parseAtom(parsed.feed);
  } else if (parsed["rdf:RDF"]?.channel || parsed["rdf:RDF"]?.item) {
    // RSS 1.0 / RDF format (Defense One uses this)
    const items = parsed["rdf:RDF"]?.item;
    return parseRSS2({ item: items } as RSSChannel);
  }

  throw new Error(`Unrecognized feed format from ${sourceName}`);
}

function parseRSS2(channel: RSSChannel): RSSFeedItem[] {
  const rawItems = channel.item;
  if (!rawItems) return [];

  const items = Array.isArray(rawItems) ? rawItems : [rawItems];

  return items
    .filter((item) => item.title && (item.link || item.guid))
    .map((item) => {
      const url = item.link || extractText(item.guid) || "";
      const tags = extractCategories(item.category);

      return {
        title: String(item.title).trim(),
        description: item.description ? stripHtml(String(item.description)).slice(0, 1000) : null,
        url: String(url).trim(),
        author: item["dc:creator"] || item.author || null,
        publishedAt: item.pubDate
          ? new Date(item.pubDate).toISOString()
          : new Date().toISOString(),
        tags,
      };
    });
}

function parseAtom(feed: AtomFeed): RSSFeedItem[] {
  const rawEntries = feed.entry;
  if (!rawEntries) return [];

  const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];

  return entries
    .filter((entry) => entry.title)
    .map((entry) => {
      const title = extractText(entry.title);
      const description = entry.summary || extractText(entry.content);
      const url = extractAtomLink(entry.link);
      const author = extractAtomAuthor(entry.author);
      const publishedAt = entry.published || entry.updated;
      const tags = extractAtomCategories(entry.category);

      return {
        title: title?.trim() || "",
        description: description ? stripHtml(String(description)).slice(0, 1000) : null,
        url: url || entry.id || "",
        author: author || null,
        publishedAt: publishedAt
          ? new Date(publishedAt).toISOString()
          : new Date().toISOString(),
        tags,
      };
    });
}

function extractText(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "#text" in value) {
    return String((value as { "#text": unknown })["#text"]);
  }
  return String(value);
}

function extractCategories(
  category: string | string[] | { "#text": string }[] | { "#text": string } | undefined
): string[] {
  if (!category) return [];
  if (typeof category === "string") return [category];
  if (Array.isArray(category)) {
    return category.map((c) => (typeof c === "string" ? c : c["#text"])).filter(Boolean);
  }
  if (typeof category === "object" && "#text" in category) {
    return [category["#text"]];
  }
  return [];
}

function extractAtomLink(
  link: { "@_href": string } | { "@_href": string }[] | undefined
): string | null {
  if (!link) return null;
  if (Array.isArray(link)) {
    const alternate = link.find(
      (l) => !("@_rel" in l) || (l as Record<string, string>)["@_rel"] === "alternate"
    );
    return alternate?.["@_href"] || link[0]?.["@_href"] || null;
  }
  return link["@_href"] || null;
}

function extractAtomAuthor(
  author: { name?: string } | { name?: string }[] | undefined
): string | null {
  if (!author) return null;
  if (Array.isArray(author)) return author[0]?.name || null;
  return author.name || null;
}

function extractAtomCategories(
  category: { "@_term": string } | { "@_term": string }[] | undefined
): string[] {
  if (!category) return [];
  if (Array.isArray(category)) return category.map((c) => c["@_term"]).filter(Boolean);
  return category["@_term"] ? [category["@_term"]] : [];
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
