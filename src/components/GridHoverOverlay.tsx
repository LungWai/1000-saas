import { GridHoverOverlayProps } from '@/types';

const GridHoverOverlay: React.FC<GridHoverOverlayProps> = ({
  price,
  isVisible,
  onPurchaseClick,
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-white/80 to-white/90 flex flex-col items-center justify-center p-2 border border-gray-200 shadow-md overflow-hidden">
      <div className="flex flex-col items-center">
        <p className="text-sm font-semibold text-gray-800 mb-2">${price}<span className="text-xs font-normal text-gray-600">/month</span></p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPurchaseClick();
          }}
          className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded hover:bg-gray-800 transition-colors shadow-sm"
        >
          Lease Grid
        </button>
      </div>
    </div>
  );
};

export default GridHoverOverlay; 