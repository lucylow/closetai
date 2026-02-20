import React from 'react';

export interface CardProps {
  title?: string;
  description?: string;
  image?: string;
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Card component for displaying content in a contained box
 * 
 * @example
 * ```tsx
 * <Card 
 *   title="Summer Outfit" 
 *   description="Light and airy look"
 *   image="/images/outfit.jpg"
 *   onClick={() => handleSelect(outfit)}
 * />
 * ```
 */
export function Card({ title, description, image, children, className = '', onClick }: CardProps) {
  const clickable = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '';

  return (
    <div 
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${clickable} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
    >
      {image && (
        <div className="aspect-square w-full overflow-hidden bg-gray-100">
          <img 
            src={image} 
            alt={title || 'Card image'} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-4">
        {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        {children}
      </div>
    </div>
  );
}

export default Card;
