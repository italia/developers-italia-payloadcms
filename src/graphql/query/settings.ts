import {
  ExternalLinkFragment,
  TagFragment,
} from "@graphql/fragment/commonFragments";
import { graphql } from "@graphql/graphql";

export const LocalesQuery = graphql(`
  query Locales {
    site: _site {
      locales
    }
  }
`);

export const SiteMetaTagsQuery = graphql(
  `
    query SiteMetaTags {
      site: _site {
        faviconMetaTags {
          ...TagFragment
        }
      }
    }
  `,
  [TagFragment],
);

export const AllGlobalSettingsQuery = graphql(
  `
    query AllGlobalSettings {
      globalSetting {
        _allLastUpdateLabelLocales {
          locale
          value
        }
        _allSiteNameLocales {
          locale
          value
        }
        _allLinksLocales {
          locale
          value {
            ...ExternalLinkFragment
          }
        }
      }
    }
  `,
  [ExternalLinkFragment],
);

