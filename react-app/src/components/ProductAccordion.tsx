import { useId, useState, type ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import { useMotionPreference } from '../hooks/useMotionPreference';
import "./ProductAccordion.css";

export type Detail = {
  id: string;
  title: string;
  content: ReactNode;
};

type ProductAccordionProps = {
  details: Detail[];
};

export default function ProductAccordion({
  details,
}: ProductAccordionProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const prefix = useId();
  const reduceMotion = useMotionPreference();

  return (
    <div className="product-details">
      {details.map((detail) => {
        const isOpen = openId === detail.id;
        const buttonId = `${prefix}-${detail.id}-button`;
        const panelId = `${prefix}-${detail.id}-panel`;

        return (
          <div className="product-details__item" key={detail.id}>
            <h3 className="product-details__heading">
              <button
                id={buttonId}
                type="button"
                className="product-details__trigger"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() =>
                  setOpenId(isOpen ? null : detail.id)
                }
              >
                {detail.title}

                <span
                  className="product-details__icon"
                  aria-hidden="true"
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>
            </h3>

            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
            >
              <AnimatePresence initial={false}>
                {isOpen && (
                  <m.div
                    key={detail.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  >
                    {typeof detail.content === 'string' ? (
                      <p className="product-details__content">{detail.content}</p>
                    ) : (
                      <div className="product-details__content">{detail.content}</div>
                    )}
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
