import { graphql } from "@graphql/graphql";

// Minimal, text-only selections of Payload block content, used exclusively to build
// the plain-text search index (src/utils/indexing/blockContentMappers.ts flattens
// whatever comes back, field names and all — aliases below are irrelevant to it).
//
// Every field is aliased uniquely per block type, even ones that look identical
// (title, paragraph, text, accordion...). This isn't cosmetic: Payload's GraphQL
// schema mints a distinct type per block for fields shared across blocks — e.g. `bg`
// is `Hero_bg` on Hero but `TextOnly_bg` on TextOnly, and `text`/`paragraph` can differ
// in nullability block to block. Two sibling `... on BlockType` arms selecting the same
// unaliased field name inside one union selection set is a GraphQL field-merge error
// the moment their underlying types don't match exactly — aliasing sidesteps it
// entirely by giving every arm its own response key.
//
// No images, links, or relationships either — just fields that carry searchable text.
// Add a new `... on BlockType { ... }` arm whenever a new block type should be searchable.

export const SearchTextBlockFragment = graphql(`
  fragment SearchTextBlockFragment on TextBlock @_unmask {
    textBlockTitle: title
    textBlockParagraph: paragraph
  }
`);

export const SearchHeroFragment = graphql(`
  fragment SearchHeroFragment on Hero @_unmask {
    heroTitle: title
    heroParagraph: paragraph
  }
`);

export const SearchTextOnlyFragment = graphql(
  `
  fragment SearchTextOnlyFragment on TextOnly @_unmask {
    textOnlyText: text { ... on TextBlock { ...SearchTextBlockFragment } }
  }
`,
  [SearchTextBlockFragment],
);

export const SearchTextImageFragment = graphql(
  `
  fragment SearchTextImageFragment on TextImage @_unmask {
    textImageText: text { ... on TextBlock { ...SearchTextBlockFragment } }
  }
`,
  [SearchTextBlockFragment],
);

export const SearchTextStatisticFragment = graphql(
  `
  fragment SearchTextStatisticFragment on TextStatistic @_unmask {
    textStatisticText: text { ... on TextBlock { ...SearchTextBlockFragment } }
  }
`,
  [SearchTextBlockFragment],
);

export const SearchTextUseCaseFragment = graphql(
  `
  fragment SearchTextUseCaseFragment on TextUseCase @_unmask {
    textUseCaseText: text { ... on TextBlock { ...SearchTextBlockFragment } }
  }
`,
  [SearchTextBlockFragment],
);

export const SearchSpeakerFragment = graphql(
  `
  fragment SearchSpeakerFragment on Speaker @_unmask {
    speakerText: text { ... on TextBlock { ...SearchTextBlockFragment } }
  }
`,
  [SearchTextBlockFragment],
);

export const SearchNewsFeedFragment = graphql(`
  fragment SearchNewsFeedFragment on NewsFeed @_unmask {
    newsFeedTitle: title
    newsFeedParagraph: paragraph
  }
`);

export const SearchSupportChannelsSectionFragment = graphql(`
  fragment SearchSupportChannelsSectionFragment on SupportChannelsSection @_unmask {
    supportChannelsTitle: title
    supportChannelsParagraph: paragraph
    supportChannelsChannels: channels {
      ... on Channel { channelTitle: title channelDescription: description }
    }
  }
`);

export const SearchTextAccordionFragment = graphql(
  `
  fragment SearchTextAccordionFragment on TextAccordion @_unmask {
    textAccordionText: text { ... on TextBlock { ...SearchTextBlockFragment } }
    textAccordionAccordion: accordion {
      ... on AccordionBlock {
        accordionBlockTitle: title
        accordionBlockAccordion: accordion {
          ... on Accordion {
            accordionItems: items { ... on AccordionItem { itemHeader: header itemBody: body } }
          }
        }
      }
    }
  }
`,
  [SearchTextBlockFragment],
);

export const SearchFaqSectionFragment = graphql(`
  fragment SearchFaqSectionFragment on FaqSection @_unmask {
    faqTitle: title
    faqAccordion: accordion {
      ... on AccordionBlock {
        faqAccordionBlockTitle: title
        faqAccordionBlockAccordion: accordion {
          ... on Accordion {
            faqAccordionItems: items { ... on AccordionItem { faqItemHeader: header faqItemBody: body } }
          }
        }
      }
    }
  }
`);

export const SearchStructuredTextBlockFragment = graphql(`
  fragment SearchStructuredTextBlockFragment on StructuredTextBlock @_unmask {
    structuredTextContent: content
  }
`);

export const SearchSupportCtaSectionFragment = graphql(`
  fragment SearchSupportCtaSectionFragment on SupportCtaSection @_unmask {
    supportCtaTitle: title
    supportCtaParagraph: paragraph
  }
`);

export const SearchCardLinkListFragment = graphql(`
  fragment SearchCardLinkListFragment on CardLinkList @_unmask {
    cardLinkListTitle: title
    cardLinkListParagraph: paragraph
    cardLinkListContent: listContent {
      ... on CardLink { cardLinkTitle: title cardLinkParagraph: paragraph }
    }
  }
`);

export const SearchListCollectionFragment = graphql(`
  fragment SearchListCollectionFragment on ListCollection @_unmask {
    listCollectionTitle: title
    listCollectionParagraph: paragraph
  }
`);

export const SearchTopicFilterFragment = graphql(`
  fragment SearchTopicFilterFragment on TopicFilter @_unmask {
    topicFilterTitle: title
    topicFilterTitleFilter: titleFilter
    topicFilterParagraph: paragraph
    topicFilterLabelForAll: labelForAll
  }
`);

export const SearchDataSectionFragment = graphql(`
  fragment SearchDataSectionFragment on DataSection @_unmask {
    dataSectionHighlights: highlights {
      ... on Highlight { highlightTitle: title highlightParagraph: paragraph }
    }
    dataSectionPanel: panel {
      ... on Panel { panelTitle: title panelParagraph: paragraph }
    }
    dataSectionResult: result {
      ... on Result { resultTitle: title resultParagraph: paragraph }
    }
  }
`);

export const SearchActionCardFragment = graphql(`
  fragment SearchActionCardFragment on ActionCard @_unmask {
    actionCardTitle: title
    actionCardParagraph: paragraph
  }
`);

export const SearchWebinarDescriptionFragment = graphql(
  `
  fragment SearchWebinarDescriptionFragment on WebinarDescription @_unmask {
    webinarDescriptionText: text { ... on TextBlock { ...SearchTextBlockFragment } }
    webinarDescriptionSubjects: subjects {
      ... on FeatureList {
        featureListItems: items {
          ... on ListItem { listItemTitle: title listItemParagraph: paragraph }
        }
      }
    }
  }
`,
  [SearchTextBlockFragment],
);
