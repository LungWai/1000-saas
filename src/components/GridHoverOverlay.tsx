import { GridHoverOverlayProps } from '@/types';

const GridHoverOverlay: React.FC<GridHoverOverlayProps> = ({
  price,
  isVisible,
  onPurchaseClick,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center text-white p-2">
      <p className="text-lg font-bold">${price}/month</p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPurchaseClick();
        }}
        className="mt-2 px-3 py-1 bg-white text-black text-sm font-medium rounded-full hover:bg-gray-100 transition-colors"
      >
        Lease This Grid
      </button>
    </div>
  );
};

export default GridHoverOverlay; 