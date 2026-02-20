import React from 'react';

interface Product {
  sku: string;
  name: string;
  type: string;
  color_hex?: string;
  match_score: number;
  url?: string;
}

interface ProductRecommendationsProps {
  products: Product[];
}

export const ProductRecommendations: React.FC<ProductRecommendationsProps> = ({ products }) => {
  return (
    <div className="product-recommendations">
      <h3>Recommended Products</h3>
      <div className="products-grid">
        {products.map((product, idx) => (
          <div key={idx} className="product-card">
            {product.color_hex && (
              <div className="product-color" style={{ backgroundColor: product.color_hex }} />
            )}
            <div className="product-info">
              <h4>{product.name}</h4>
              <span className="product-type">{product.type}</span>
              <span className="match-score">Match: {Math.round(product.match_score * 100)}%</span>
            </div>
            {product.url && <a href={product.url}>View</a>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductRecommendations;
