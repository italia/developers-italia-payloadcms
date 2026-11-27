import type { ImageProps } from "@components/atoms/Image/types";
import { Chip } from "@components/react/Chip";
import { DateTime } from "@components/react/DateTime";
import { Image } from "@components/react/Image";
import type { SiteLocale } from "@graphql/types";
import { getI18n } from "@i18n/microcopy";
import { singleParagraphInner } from "@utils/singleParagraph";

export type CardEditorialStoryProps = {
  id?: string;
  title: string;
  description: string;
  image: ImageProps;
  linkTo: string;
  category?: string;
  dateTime?: string;
  lang: SiteLocale;
  ariaLabelCardCategory?: string;
};

export function CardEditorialStory({
  id = "",
  title,
  description,
  image,
  linkTo,
  category,
  dateTime,
  lang,
}: CardEditorialStoryProps) {
  const shouldShowFooter = !!category || !!dateTime;
  const cardTitleId = `card-title-${id}`;
  const t = getI18n(lang);

  // A single paragraph from the CMS is rendered as <p>, not nested in a div.
  const descriptionInner = description
    ? singleParagraphInner(description)
    : "";

  return (
    <article
      className="it-card it-card-image it-card-height-full rounded shadow-sm border"
      aria-labelledby={cardTitleId}
    >
      <h3 className="it-card-title" id={cardTitleId}>
        <a href={linkTo}>
          {title}
          <span className="visually-hidden">{t["link.internal"]}</span>
        </a>
      </h3>

      <div className="it-card-image-wrapper">
        <div className="ratio ratio-16x9">
          <figure className="figure img-full">
            {/* Decorative: the card title already says what the image shows */}
            <Image {...image} alt="" />
          </figure>
        </div>
      </div>

      <div className="it-card-body">
        {descriptionInner !== null ? (
          <p
            className="it-card-text"
            dangerouslySetInnerHTML={{ __html: descriptionInner }}
          />
        ) : (
          <div
            className="it-card-text"
            dangerouslySetInnerHTML={{ __html: description ?? "" }}
          />
        )}
      </div>

      {shouldShowFooter && (
        <footer className="it-card-related it-card-footer">
          {category && (
            <div className="it-card-taxonomy">
              <Chip
                label={category}
                visuallyHidden={t["card.topic"]}
                disabled
              />
            </div>
          )}
          {dateTime && (
            <DateTime className="it-card-date" value={dateTime} lang={lang} />
          )}
        </footer>
      )}
    </article>
  );
}
