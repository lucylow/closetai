import React from 'react';

interface ColorPalette {
  hex: string;
  name: string;
  category: string;
}

interface PaletteViewerProps {
  palette: ColorPalette[];
}

export const PaletteViewer: React.FC<PaletteViewerProps> = ({ palette }) => {
  return (
    <div className="palette-viewer">
      <h3>Your Color Palette</h3>
      <div className="palette-colors">
        {palette.map((color, idx) => (
          <div key={idx} className="palette-color" title={color.name}>
            <div className="color-circle" style={{ backgroundColor: color.hex }} />
            <span>{color.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaletteViewer;
