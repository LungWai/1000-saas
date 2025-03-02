import { GridHoverOverlayProps } from '@/types';
import { GridProps } from '@/types';

interface ExtendedGridHoverOverlayProps extends GridHoverOverlayProps, GridProps {
  isLoading?: boolean;
}

const GridHoverOverlay: React.FC<ExtendedGridHoverOverlayProps> = ({
  id,
  status,
  price,
  imageUrl,
  title,
  description,
  externalUrl,
  isVisible,
  isLoading = false,
  onPurchaseClick,
}) => {
  if (!isVisible) return null;
  
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading) {
      onPurchaseClick();
    }
  };
  
  return (
    <div className="grid-hover-overlay">
      <div style={{ fontSize: '0.4em', transform: 'scale(0.4)' }}>
        <p>ID: {id}</p>
        <p>Status: {status}</p>
        <p>Price: {price}</p>
        <p>Image URL: {imageUrl}</p>
        <p>Title: {title}</p>
        <p>Description: {description}</p>
        <p>External URL: {externalUrl}</p>
      </div>
      <div>
        <span className="grid-hover-price">${price}</span>
        <span className="grid-hover-month">/month</span>
      </div>
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className={`grid-hover-button ${isLoading ? 'opacity-75 cursor-not-allowed' : ''}`}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="w-2 h-2 border-t-1 border-white rounded-full animate-spin"></div>
            <span className="ml-1">Loading...</span>
          </div>
        ) : (
          'Lease Grid'
        )}
      </button>
    </div>
  );
};

export default GridHoverOverlay; 