import type { SectionBackground } from "@utils/background";

export type PageNewsTab = {
  title: string;
  paragraph: string;
  filterTitle: string;
  labelForAll: string;
  filterStory?: string;
  newsPageTabType: string;
  perPage?: number;
  sortMode?: string;
};

export type UpdateTabSectionProps = {
  id: string;
  background?: SectionBackground;
  tabs: PageNewsTab[];
};

// PayloadCMS stores short form values; DatoCMS used the _item suffix.
// Accept both so the component works during and after migration.
export type ElementType =
  | "news"
  | "news_item"
  | "story"
  | "story_item"
  | "webinar"
  | "webinar_item"
  | "resource";
