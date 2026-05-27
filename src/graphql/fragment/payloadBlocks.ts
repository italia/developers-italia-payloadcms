import { graphql, type FragmentOf } from "@graphql/graphql";

// ─── Primitives ──────────────────────────────────────────────────────────────

export const PayloadMediaFragment = graphql(`
  fragment PayloadMediaFragment on Media @_unmask {
    id
    url
    alt
    width
    height
    filename
    mimeType
  }
`);
export type PayloadMediaFragmentType = FragmentOf<typeof PayloadMediaFragment>;

export const PayloadExternalLinkFragment = graphql(`
  fragment PayloadExternalLinkFragment on ExternalLink @_unmask {
    id
    blockType
    label
    url
    description
  }
`);
export type PayloadExternalLinkFragmentType = FragmentOf<typeof PayloadExternalLinkFragment>;

export const PayloadDownloadLinkFragment = graphql(
  `
  fragment PayloadDownloadLinkFragment on DownloadLink @_unmask {
    id
    blockType
    label
    description
    doc { ...PayloadMediaFragment }
  }
`,
  [PayloadMediaFragment],
);
export type PayloadDownloadLinkFragmentType = FragmentOf<typeof PayloadDownloadLinkFragment>;

export const PayloadInternalLinkFragment = graphql(`
  fragment PayloadInternalLinkFragment on InternalLink @_unmask {
    id
    blockType
    label
    linkTo {
      relationTo
      value {
        ... on Page { id slug localizedSlugs }
        ... on Article { id slug localizedSlugs }
        ... on Insight { id slug localizedSlugs }
        ... on WebinarItem { id slug localizedSlugs }
        ... on StoryItem { id slug localizedSlugs }
        ... on Catalogue { id slug localizedSlugs }
      }
    }
  }
`);
export type PayloadInternalLinkFragmentType = FragmentOf<typeof PayloadInternalLinkFragment>;

export const PayloadTextBlockFragment = graphql(
  `
  fragment PayloadTextBlockFragment on TextBlock @_unmask {
    id
    blockType
    title
    paragraph
    cta {
      ... on InternalLink { ...PayloadInternalLinkFragment }
      ... on ExternalLink { ...PayloadExternalLinkFragment }
    }
  }
`,
  [PayloadInternalLinkFragment, PayloadExternalLinkFragment],
);
export type PayloadTextBlockFragmentType = FragmentOf<typeof PayloadTextBlockFragment>;

// ─── Shared Blocks ───────────────────────────────────────────────────────────

export const PayloadHeroFragment = graphql(
  `
  fragment PayloadHeroFragment on Hero @_unmask {
    id
    blockType
    variant
    bg
    showBreadcrumb
    title
    paragraph
    backgroundImage { ...PayloadMediaFragment }
    backgroundImageForMobile { ...PayloadMediaFragment }
    cta {
      ... on InternalLink { ...PayloadInternalLinkFragment }
      ... on ExternalLink { ...PayloadExternalLinkFragment }
    }
  }
`,
  [PayloadMediaFragment, PayloadInternalLinkFragment, PayloadExternalLinkFragment],
);
export type PayloadHeroFragmentType = FragmentOf<typeof PayloadHeroFragment>;

export const PayloadTextOnlyFragment = graphql(
  `
  fragment PayloadTextOnlyFragment on TextOnly @_unmask {
    id
    blockType
    bg
    heading
    text {
      ... on TextBlock { ...PayloadTextBlockFragment }
    }
  }
`,
  [PayloadTextBlockFragment],
);
export type PayloadTextOnlyFragmentType = FragmentOf<typeof PayloadTextOnlyFragment>;

export const PayloadTextImageFragment = graphql(
  `
  fragment PayloadTextImageFragment on TextImage @_unmask {
    id
    blockType
    variant
    bg
    heading
    image { ...PayloadMediaFragment }
    text {
      ... on TextBlock { ...PayloadTextBlockFragment }
    }
    additionalContent {
      ... on AdditionalContent {
        id
        blockType
        title
        content {
          ... on CardEditorialWithIcon {
            id
            blockType
            title
            description
            iconSelect
          }
        }
      }
    }
  }
`,
  [PayloadMediaFragment, PayloadTextBlockFragment],
);
export type PayloadTextImageFragmentType = FragmentOf<typeof PayloadTextImageFragment>;

export const PayloadFaqSectionFragment = graphql(`
  fragment PayloadFaqSectionFragment on FaqSection @_unmask {
    id
    blockType
    bg
    title
    accordion {
      ... on AccordionBlock {
        id
        blockType
        title
        accordion {
          ... on Accordion {
            id
            blockType
            items {
              ... on AccordionItem {
                id
                blockType
                header
                body
              }
            }
          }
        }
      }
    }
  }
`);
export type PayloadFaqSectionFragmentType = FragmentOf<typeof PayloadFaqSectionFragment>;

export const PayloadStructuredTextBlockFragment = graphql(`
  fragment PayloadStructuredTextBlockFragment on StructuredTextBlock @_unmask {
    id
    blockType
    bg
    content
  }
`);
export type PayloadStructuredTextBlockFragmentType = FragmentOf<typeof PayloadStructuredTextBlockFragment>;

export const PayloadSupportChannelsSectionFragment = graphql(`
  fragment PayloadSupportChannelsSectionFragment on SupportChannelsSection @_unmask {
    id
    blockType
    bg
    title
    paragraph
    channels {
      ... on Channel {
        id
        blockType
        title
        description
        iconSelect
        linkTo
      }
    }
  }
`);
export type PayloadSupportChannelsSectionFragmentType = FragmentOf<typeof PayloadSupportChannelsSectionFragment>;

export const PayloadTextAccordionFragment = graphql(
  `
  fragment PayloadTextAccordionFragment on TextAccordion @_unmask {
    id
    blockType
    bg
    text {
      ... on TextBlock { ...PayloadTextBlockFragment }
    }
    accordion {
      ... on AccordionBlock {
        id
        blockType
        title
        accordion {
          ... on Accordion {
            id
            items {
              ... on AccordionItem {
                id
                blockType
                header
                body
              }
            }
          }
        }
      }
    }
  }
`,
  [PayloadTextBlockFragment],
);
export type PayloadTextAccordionFragmentType = FragmentOf<typeof PayloadTextAccordionFragment>;

export const PayloadSupportCtaSectionFragment = graphql(
  `
  fragment PayloadSupportCtaSectionFragment on SupportCtaSection @_unmask {
    id
    blockType
    bg
    title
    paragraph
    image { ...PayloadMediaFragment }
    cta {
      ... on InternalLink { ...PayloadInternalLinkFragment }
      ... on ExternalLink { ...PayloadExternalLinkFragment }
    }
  }
`,
  [PayloadMediaFragment, PayloadInternalLinkFragment, PayloadExternalLinkFragment],
);
export type PayloadSupportCtaSectionFragmentType = FragmentOf<typeof PayloadSupportCtaSectionFragment>;

export const PayloadTextStatisticFragment = graphql(
  `
  fragment PayloadTextStatisticFragment on TextStatistic @_unmask {
    id
    blockType
    bg
    showInline
    text {
      ... on TextBlock { ...PayloadTextBlockFragment }
    }
    statistics {
      ... on StatisticBlock {
        id
        blockType
        statistics {
          ... on DataContainer {
            id
            blockType
            title
            info
            iconSelect
          }
        }
      }
    }
  }
`,
  [PayloadTextBlockFragment],
);
export type PayloadTextStatisticFragmentType = FragmentOf<typeof PayloadTextStatisticFragment>;

export const PayloadCardLinkListFragment = graphql(
  `
  fragment PayloadCardLinkListFragment on CardLinkList @_unmask {
    id
    blockType
    bg
    showInlineCard
    title
    paragraph
    listContent {
      ... on CardLink {
        id
        blockType
        title
        paragraph
        image { ...PayloadMediaFragment }
        link {
          ... on LinkBlock {
            id
            blockType
            externalUrl
            link {
              relationTo
              value {
                ... on Page { id slug localizedSlugs }
                ... on Article { id slug localizedSlugs }
                ... on Insight { id slug localizedSlugs }
                ... on WebinarItem { id slug localizedSlugs }
                ... on StoryItem { id slug localizedSlugs }
                ... on Catalogue { id slug localizedSlugs }
              }
            }
          }
        }
      }
    }
  }
`,
  [PayloadMediaFragment],
);
export type PayloadCardLinkListFragmentType = FragmentOf<typeof PayloadCardLinkListFragment>;

export const PayloadTextUseCaseFragment = graphql(
  `
  fragment PayloadTextUseCaseFragment on TextUseCase @_unmask {
    id
    blockType
    bg
    text {
      ... on TextBlock { ...PayloadTextBlockFragment }
    }
    useCases {
      ... on UseCaseBlock {
        id
        blockType
        title
        useCases {
          relationTo
          value {
            ... on Article { id slug title localizedSlugs }
            ... on Insight { id slug title localizedSlugs }
            ... on WebinarItem { id slug title localizedSlugs }
            ... on StoryItem { id slug title localizedSlugs }
            ... on Page { id slug title localizedSlugs }
          }
        }
      }
    }
  }
`,
  [PayloadTextBlockFragment],
);
export type PayloadTextUseCaseFragmentType = FragmentOf<typeof PayloadTextUseCaseFragment>;

export const PayloadNewsFeedFragment = graphql(`
  fragment PayloadNewsFeedFragment on NewsFeed @_unmask {
    id
    blockType
    bg
    title
    paragraph
    tabs {
      ... on NewsTab {
        id
        blockType
        title
        news {
          id
          slug
          title
          localizedSlugs
        }
      }
      ... on StoryTab {
        id
        blockType
        title
        news {
          id
          slug
          title
          localizedSlugs
        }
      }
    }
    cta {
      ... on InternalLink { id blockType label }
      ... on ExternalLink { id blockType label url }
    }
  }
`);
export type PayloadNewsFeedFragmentType = FragmentOf<typeof PayloadNewsFeedFragment>;

export const PayloadListCollectionFragment = graphql(`
  fragment PayloadListCollectionFragment on ListCollection @_unmask {
    id
    blockType
    title
    paragraph
    content {
      relationTo
      value {
        ... on Article { id slug title localizedSlugs }
        ... on Insight { id slug title localizedSlugs }
        ... on WebinarItem { id slug title localizedSlugs }
        ... on StoryItem { id slug title localizedSlugs }
        ... on Page { id slug title localizedSlugs }
      }
    }
  }
`);
export type PayloadListCollectionFragmentType = FragmentOf<typeof PayloadListCollectionFragment>;

// ─── WebinarItem-specific blocks ─────────────────────────────────────────────

export const PayloadActionCardFragment = graphql(
  `
  fragment PayloadActionCardFragment on ActionCard @_unmask {
    id
    blockType
    title
    category
    paragraph
    readMoreLabel
    readLessLabel
    cta {
      ... on DownloadLink { ...PayloadDownloadLinkFragment }
    }
  }
`,
  [PayloadDownloadLinkFragment],
);
export type PayloadActionCardFragmentType = FragmentOf<typeof PayloadActionCardFragment>;

export const PayloadSpeakerFragment = graphql(
  `
  fragment PayloadSpeakerFragment on Speaker @_unmask {
    id
    blockType
    text {
      ... on TextBlock { ...PayloadTextBlockFragment }
    }
    list {
      ... on AuthorList {
        id
        blockType
        title
        authors {
          id
          updatedAt
          createdAt
        }
      }
    }
  }
`,
  [PayloadTextBlockFragment],
);
export type PayloadSpeakerFragmentType = FragmentOf<typeof PayloadSpeakerFragment>;

export const PayloadWebinarDescriptionFragment = graphql(
  `
  fragment PayloadWebinarDescriptionFragment on WebinarDescription @_unmask {
    id
    blockType
    text {
      ... on TextBlock { ...PayloadTextBlockFragment }
    }
    subjects {
      ... on FeatureList {
        id
        blockType
        items {
          ... on ListItem {
            id
            blockType
            title
            paragraph
          }
        }
      }
    }
    resources {
      ... on QuickLinkCard {
        id
        blockType
        title
        linkToResource {
          relationTo
          value {
            ... on Article { id slug title localizedSlugs }
            ... on Insight { id slug title localizedSlugs }
            ... on WebinarItem { id slug title localizedSlugs }
            ... on StoryItem { id slug title localizedSlugs }
            ... on Page { id slug title localizedSlugs }
          }
        }
      }
    }
  }
`,
  [PayloadTextBlockFragment],
);
export type PayloadWebinarDescriptionFragmentType = FragmentOf<typeof PayloadWebinarDescriptionFragment>;

// ─── Catalogue-specific blocks ───────────────────────────────────────────────

export const PayloadCalloutLinkFragment = graphql(
  `
  fragment PayloadCalloutLinkFragment on CalloutLink @_unmask {
    id
    blockType
    title
    paragraph
    link {
      ... on ExternalLink { ...PayloadExternalLinkFragment }
    }
  }
`,
  [PayloadExternalLinkFragment],
);
export type PayloadCalloutLinkFragmentType = FragmentOf<typeof PayloadCalloutLinkFragment>;

export const PayloadCatalogueFeedFragment = graphql(`
  fragment PayloadCatalogueFeedFragment on CatalogueFeed @_unmask {
    id
    blockType
    tabs {
      ... on CatalogueTab {
        id
        blockType
        title
        paragraph
        filterTitle
        labelForAll
        newsPageTabType
        elementPerPage
      }
    }
  }
`);
export type PayloadCatalogueFeedFragmentType = FragmentOf<typeof PayloadCatalogueFeedFragment>;

// ─── Navigation / Menu ───────────────────────────────────────────────────────

export const PayloadMenuItemFragment = graphql(`
  fragment PayloadMenuItemFragment on MenuItem @_unmask {
    id
    blockType
    title
    pointsTo {
      relationTo
      value {
        ... on Page { id }
        ... on Article { id }
        ... on Insight { id }
        ... on WebinarItem { id }
        ... on StoryItem { id }
        ... on Catalogue { id }
      }
    }
  }
`);
export type PayloadMenuItemFragmentType = FragmentOf<typeof PayloadMenuItemFragment>;

export const PayloadMegaMenuItemFragment = graphql(
  `
  fragment PayloadMegaMenuItemFragment on MegaMenuItem @_unmask {
    id
    blockType
    title
    subtitle
    caption
    image { ...PayloadMediaFragment }
    pointsTo {
      relationTo
      value {
        ... on Page { id }
        ... on Article { id }
        ... on Insight { id }
        ... on WebinarItem { id }
        ... on StoryItem { id }
        ... on Catalogue { id }
      }
    }
    subMenu {
      ... on MenuItem {
        ...PayloadMenuItemFragment
      }
    }
  }
`,
  [PayloadMediaFragment, PayloadMenuItemFragment],
);
export type PayloadMegaMenuItemFragmentType = FragmentOf<typeof PayloadMegaMenuItemFragment>;
