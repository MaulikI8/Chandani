import { useState } from 'react';
import { useApp } from '../state/AppContext';
import { Icon } from './Icon';

export type RoomCategory = 'living' | 'dining' | 'bedroom' | 'kitchen';

interface RoomAdvice {
  rugSize: string;
  furnitureScale: string;
  walkwayClearance: string;
  goldenRule: string;
}

export function PlanningAssistant() {
  const { openEnquiry } = useApp();
  const [roomType, setRoomType] = useState<RoomCategory>('living');
  const [length, setLength] = useState<number>(4.8); // in meters
  const [width, setWidth] = useState<number>(4.2); // in meters

  const lengthFt = (length * 3.28084).toFixed(1);
  const widthFt = (width * 3.28084).toFixed(1);
  const areaSqM = (length * width).toFixed(1);
  const areaSqFt = (length * width * 10.7639).toFixed(0);

  const getAdvice = (): RoomAdvice => {
    if (roomType === 'living') {
      const rug = length >= 5 || width >= 4.5 ? '9 ft × 12 ft (2.7 m × 3.6 m)' : '8 ft × 10 ft (2.4 m × 3.0 m)';
      const sofa = length >= 5 ? '2.4 m to 2.7 m 3-seater with chaise' : '2.1 m to 2.3 m 3-seater';
      return {
        rugSize: rug,
        furnitureScale: `Recommended sofa length: ${sofa}`,
        walkwayClearance: 'Main traffic pathways: minimum 90 cm. Coffee table distance: 38–45 cm from sofa edge.',
        goldenRule: 'Front legs of all main seating pieces should rest 20–30 cm onto the rug to anchor the group together.',
      };
    }
    if (roomType === 'dining') {
      const seats = length >= 5 && width >= 3.8 ? '8 to 10 guests (2.4 m to 2.8 m table)' : '6 guests (1.8 m to 2.2 m table)';
      return {
        rugSize: 'Must extend at least 60 cm beyond table perimeter on all four sides',
        furnitureScale: `Recommended capacity: ${seats}`,
        walkwayClearance: 'Minimum 75 cm chair pull-out clearance (90 cm if adjacent to a credenza or doorway).',
        goldenRule: 'Ensure dining chair legs never catch on the carpet edge when guests slide back from the table.',
      };
    }
    if (roomType === 'bedroom') {
      const bed = width >= 4.0 ? 'King bed (192 cm width) with dual 60 cm nightstands' : 'Queen bed (160 cm width)';
      return {
        rugSize: '8 ft × 10 ft placed under lower two-thirds of the bed, extending 70 cm on sides and foot',
        furnitureScale: `Recommended bed scale: ${bed}`,
        walkwayClearance: 'Minimum 65–75 cm bedside walkways to allow natural closet and drawer opening.',
        goldenRule: 'Leave the head of the bed and nightstands on bare timber for easier cord and lamp management.',
      };
    }
    // kitchen
    return {
      rugSize: 'Runner format: 75 cm × 250 cm placed along the main preparation or sink counter',
      furnitureScale: 'Island dimensions: recommended 90 cm to 110 cm depth with seating overhang of 30 cm',
      walkwayClearance: 'Minimum 100 cm between island and counters for single cook; 120 cm for dual-cook traffic.',
      goldenRule: 'The work triangle (sink to stove to refrigerator) should total between 4.0 m and 7.5 m in perimeter.',
    };
  };

  const advice = getAdvice();

  const handleApplySpecs = () => {
    const details = `${roomType.toUpperCase()} Room Dimensions: ${length} m × ${width} m (${lengthFt} ft × ${widthFt} ft / ${areaSqFt} sq.ft). Recommended rug: ${advice.rugSize}. Scale: ${advice.furnitureScale}.`;
    openEnquiry(`Interior Planning Consultation - ${roomType.charAt(0).toUpperCase() + roomType.slice(1)}`, 'private', details);
  };

  return (
    <div className="planning-assistant" id="planningAssistant">
      <div className="assistant-header">
        <div>
          <span className="eyebrow">ARCHITECTURAL PROPORTIONS &amp; SCALE</span>
          <h3>The Interior Planning Assistant</h3>
          <p>
            Avoid costly sizing mistakes before you purchase. Test your exact room dimensions to calculate recommended carpet sizes, sofa lengths, dining clearances, and circulation walkways.
          </p>
        </div>
        <div className="room-type-tabs" role="tablist" aria-label="Select room type for planning advice">
          {(['living', 'dining', 'bedroom', 'kitchen'] as RoomCategory[]).map((type) => (
            <button
              key={type}
              type="button"
              role="tab"
              aria-selected={roomType === type}
              className={`room-type-tab${roomType === type ? ' active' : ''}`}
              onClick={() => setRoomType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="assistant-body">
        {/* Controls */}
        <div className="assistant-controls-card">
          <h4>Room Dimensions</h4>
          <div className="dimension-slider-group">
            <div className="slider-label-row">
              <label htmlFor="lengthSlider">Room Length</label>
              <span className="slider-val">{length.toFixed(1)} m ({lengthFt} ft)</span>
            </div>
            <input
              id="lengthSlider"
              type="range"
              min="3.0"
              max="9.0"
              step="0.2"
              value={length}
              onChange={(e) => setLength(parseFloat(e.target.value))}
              aria-label="Room length in meters"
            />
          </div>

          <div className="dimension-slider-group">
            <div className="slider-label-row">
              <label htmlFor="widthSlider">Room Width</label>
              <span className="slider-val">{width.toFixed(1)} m ({widthFt} ft)</span>
            </div>
            <input
              id="widthSlider"
              type="range"
              min="2.5"
              max="7.0"
              step="0.2"
              value={width}
              onChange={(e) => setWidth(parseFloat(e.target.value))}
              aria-label="Room width in meters"
            />
          </div>

          <div className="room-area-summary">
            <div>
              <span>Estimated Floor Area</span>
              <strong>{areaSqM} m² <small>({areaSqFt} sq. ft)</small></strong>
            </div>
            <div>
              <span>Room Category</span>
              <strong style={{ textTransform: 'capitalize' }}>{roomType}</strong>
            </div>
          </div>

          {/* Interactive Scaled Diagram */}
          <div className="floorplan-mini-diagram" aria-hidden="true">
            <svg viewBox="0 0 320 200" className="floorplan-svg">
              <rect x="20" y="20" width="280" height="160" rx="4" fill="var(--warm-stone, #ede8e1)" stroke="var(--ink, #1f2022)" strokeWidth="1.5" strokeDasharray="4 2" />
              {roomType === 'living' && (
                <>
                  {/* Rug */}
                  <rect x="70" y="50" width="180" height="100" rx="2" fill="#c79279" opacity="0.45" />
                  <text x="160" y="105" textAnchor="middle" fontSize="10" fill="var(--ink, #1f2022)" fontWeight="600">RECOMMENDED RUG</text>
                  {/* Sofa */}
                  <rect x="90" y="40" width="140" height="35" rx="3" fill="#ffffff" stroke="var(--ink, #1f2022)" strokeWidth="1.2" />
                  <text x="160" y="62" textAnchor="middle" fontSize="9" fill="var(--ink, #1f2022)">Haven Sofa (2.2m)</text>
                  {/* Table */}
                  <rect x="125" y="90" width="70" height="30" rx="3" fill="#5c341f" opacity="0.85" />
                  <text x="160" y="108" textAnchor="middle" fontSize="8" fill="#ffffff">Coffee Table</text>
                  {/* Clearance arrows */}
                  <line x1="20" y1="95" x2="65" y2="95" stroke="#8a8782" strokeWidth="1" strokeDasharray="2 2" />
                  <text x="42" y="90" textAnchor="middle" fontSize="8" fill="#8a8782">90cm path</text>
                </>
              )}
              {roomType === 'dining' && (
                <>
                  <rect x="60" y="45" width="200" height="110" rx="2" fill="#c79279" opacity="0.45" />
                  <text x="160" y="60" textAnchor="middle" fontSize="9" fill="var(--ink, #1f2022)" fontWeight="600">RUG EXTENSION (+60cm)</text>
                  <rect x="100" y="70" width="120" height="60" rx="4" fill="#5c341f" opacity="0.9" />
                  <text x="160" y="105" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="600">Arc Dining Table</text>
                  <circle cx="120" cy="55" r="8" fill="#ffffff" stroke="var(--ink)" strokeWidth="1" />
                  <circle cx="160" cy="55" r="8" fill="#ffffff" stroke="var(--ink)" strokeWidth="1" />
                  <circle cx="200" cy="55" r="8" fill="#ffffff" stroke="var(--ink)" strokeWidth="1" />
                  <circle cx="120" cy="145" r="8" fill="#ffffff" stroke="var(--ink)" strokeWidth="1" />
                  <circle cx="160" cy="145" r="8" fill="#ffffff" stroke="var(--ink)" strokeWidth="1" />
                  <circle cx="200" cy="145" r="8" fill="#ffffff" stroke="var(--ink)" strokeWidth="1" />
                </>
              )}
              {roomType === 'bedroom' && (
                <>
                  <rect x="80" y="70" width="160" height="100" rx="2" fill="#c79279" opacity="0.45" />
                  <rect x="105" y="30" width="110" height="110" rx="3" fill="#ffffff" stroke="var(--ink, #1f2022)" strokeWidth="1.2" />
                  <text x="160" y="90" textAnchor="middle" fontSize="10" fill="var(--ink, #1f2022)">Rest Bed (King)</text>
                  <rect x="75" y="30" width="22" height="22" rx="2" fill="#5c341f" />
                  <rect x="223" y="30" width="22" height="22" rx="2" fill="#5c341f" />
                  <text x="86" y="44" textAnchor="middle" fontSize="7" fill="#ffffff">Stand</text>
                  <text x="234" y="44" textAnchor="middle" fontSize="7" fill="#ffffff">Stand</text>
                </>
              )}
              {roomType === 'kitchen' && (
                <>
                  <rect x="20" y="20" width="280" height="35" fill="#ded8ce" stroke="var(--ink)" strokeWidth="1" />
                  <text x="160" y="42" textAnchor="middle" fontSize="9" fill="var(--ink)">Wall Cabinets &amp; Prep Counter (60cm depth)</text>
                  <rect x="70" y="95" width="180" height="45" rx="3" fill="#5c341f" opacity="0.9" />
                  <text x="160" y="122" textAnchor="middle" fontSize="10" fill="#ffffff" fontWeight="600">Central Island (Walnut &amp; Stone)</text>
                  <line x1="160" y1="56" x2="160" y2="94" stroke="#c79279" strokeWidth="1.5" strokeDasharray="3 2" />
                  <text x="165" y="78" fontSize="8" fill="var(--ink)" fontWeight="600">100–120cm Walkway</text>
                </>
              )}
            </svg>
          </div>
        </div>

        {/* Ergonomic Findings Card */}
        <div className="assistant-findings-card">
          <span className="eyebrow">TAILORED ERGONOMIC SPECIFICATIONS</span>
          <h4>Recommendations for your {roomType} space</h4>

          <div className="advice-spec-list">
            <div className="advice-item">
              <span className="advice-badge">CARPET SCALE</span>
              <p><strong>{advice.rugSize}</strong></p>
            </div>
            <div className="advice-item">
              <span className="advice-badge">FURNITURE PROPORTION</span>
              <p><strong>{advice.furnitureScale}</strong></p>
            </div>
            <div className="advice-item">
              <span className="advice-badge">CIRCULATION CLEARANCE</span>
              <p>{advice.walkwayClearance}</p>
            </div>
            <div className="advice-item advice-golden-rule">
              <span className="advice-badge">ARCHITECTURAL RULE</span>
              <p><em>&ldquo;{advice.goldenRule}&rdquo;</em></p>
            </div>
          </div>

          <div className="findings-action">
            <button type="button" className="button" onClick={handleApplySpecs}>
              Apply dimensions to consultation enquiry <Icon />
            </button>
            <p className="fineprint">
              Dimensions will pre-populate your consultation draft. Our design team will verify structural tolerances and site constraints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanningAssistant;
