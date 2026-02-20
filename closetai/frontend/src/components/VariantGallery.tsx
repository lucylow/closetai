import React from 'react';

interface Variant {
  color_hex?: string;
  preview_url: string;
  name?: string;
  style_id?: string;
}

interface VariantGalleryProps {
  title: string;
  variants: Variant[];
  onSelect?: (variant: Variant) => void;
}

export const VariantGallery: React.FC<VariantGalleryProps> = ({ title, variants, onSelect }) => {
  return (
    <div className="variant-gallery">
      <h3>{title}</h3>
      <div className="variants-grid">
        {variants.map((variant, idx) => (
          <div key={idx} className="variant-card" onClick={() => onSelect?.(variant)}>
            {variant.color_hex && (
              <div className="color-swatch" style={{ backgroundColor: variant.color_hex }} />
            )}
            {variant.preview_url && (
              <img src={variant.preview_url} alt={variant.name || 'Variant'} />
            )}
            <span className="variant-name">{variant.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VariantGallery;
