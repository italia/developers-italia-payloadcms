// Static fallback for layout/global-settings when DatoCMS has no data.
// Used by loaders so collections are never empty and Layout never bails.

export const STATIC_LAYOUT_RECORD = {
  id: "layout",
  variant: "light",
  locales: ["it", "en"],
  siteName: "",
  logoSelect: null,
  allMainNavigation: [],
  allSecondaryNavigation: [],
  allMetaNavigation: [],
  _allTaglineLocales: [],
  _allListNavbarBrandLocales: [],
  _allHeadingLocales: [],
  _allOrganizationsLocales: [],
  _allTopicTitleLocales: [],
  _allTopicLinkLocales: [],
  _allUtilityTitleLocales: [],
  _allUtilityLocales: [],
  _allSmallPrintLocales: [],
  _allMailingListFormLocales: [],
  showSitemapLink: false,
};

export const STATIC_GLOBAL_SETTINGS_VALUE = {
  siteName: "",
  lastUpdateLabel: "",
  links: [] as { label: string; url: string }[],
};
