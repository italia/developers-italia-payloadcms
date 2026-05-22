import { DatoBlockModel } from "./cmsMapper";

type CatalogueFeedBlock = {
  componentName: string;
  tabs: { newsPageTabType: string }[];
};

function isCatalogueFeedBlock(c: unknown): c is CatalogueFeedBlock {
  return (
    typeof c === "object" &&
    c !== null &&
    (c as CatalogueFeedBlock).componentName === DatoBlockModel.CatalogueFeed
  );
}

export const getLastUpdateCollection = (
  content: unknown[] | undefined,
  datesRegistry: Record<string, string>,
) => {
  if (!content) {
    return;
  }

  const feedRecord = content.find(isCatalogueFeedBlock);
  let finalUpdateDate = null;

  if (feedRecord?.tabs) {
    const allDates = feedRecord.tabs
      .map((tab) => {
        const dateString = datesRegistry[tab.newsPageTabType];
        return dateString ? new Date(dateString).getTime() : null;
      })
      .filter((time): time is number => time !== null);

    if (allDates.length > 0) {
      finalUpdateDate = new Date(Math.max(...allDates)).toISOString();
    }
  }

  return finalUpdateDate;
};
