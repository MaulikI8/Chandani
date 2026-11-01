import { useEffect } from "react";
import useEmblaCarousel from "embla-carousel-react";
import "./FurnitureTray.css";

export type FurnitureOption = {
  id: string;
  name: string;
  finish: string;
  image: string;
};

type FurnitureTrayProps = {
  items: FurnitureOption[];
  selectedId: string;
  onSelect: (item: FurnitureOption) => void;
};

export default function FurnitureTray({
  items,
  selectedId,
  onSelect,
}: FurnitureTrayProps) {
  const [viewportRef, carousel] = useEmblaCarousel({
    align: "start",
    loop: false,
  });

  useEffect(() => {
    if (!carousel) return;

    const index = items.findIndex((item) => item.id === selectedId);

    if (index >= 0) {
      carousel.scrollTo(index, true);
    }
  }, [carousel, items, selectedId]);

  return (
    <section className="furniture-tray" aria-label="Furniture options">
      <div className="furniture-tray__heading">
        <div>
          <p>MAKE IT YOURS</p>
          <h3>Find your finishing touch.</h3>
        </div>

        <span className="furniture-tray__hint">
          Swipe to explore
        </span>
      </div>

      <div className="furniture-tray__viewport" ref={viewportRef}>
        <div className="furniture-tray__track">
          {items.map((item) => (
            <div className="furniture-tray__slide" key={item.id}>
              <button
                type="button"
                className="furniture-card"
                aria-pressed={selectedId === item.id}
                onClick={() => onSelect(item)}
              >
                <div className="furniture-card__image">
                  <img
                    src={item.image}
                    alt=""
                    loading="lazy"
                    draggable={false}
                  />

                  {selectedId === item.id && (
                    <span
                      className="furniture-card__check"
                      aria-hidden="true"
                    >
                      ✓
                    </span>
                  )}
                </div>

                <span className="furniture-card__name">
                  {item.name}
                </span>

                <span className="furniture-card__finish">
                  {item.finish}
                </span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
