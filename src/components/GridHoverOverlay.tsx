import { GridHoverOverlayProps } from '@/types';

const GridHoverOverlay: React.FC<GridHoverOverlayProps> = ({
  price,
  isVisible,
  onPurchaseClick,
}) => {
  if (!isVisible) return null;
  
  return (
    <div className="grid-hover-overlay">
      <div>
        <span className="grid-hover-price">${price}</span>
        <span className="grid-hover-month">/month</span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPurchaseClick();
        }}
        className="grid-hover-button"
      >
        Lease Grid
      </button>
    </div>
  );
};

export default GridHoverOverlay; 