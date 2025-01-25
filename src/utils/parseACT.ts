/**
 * Parses an Adobe Color Table (.act) file and returns an array of hex color codes
 * @param buffer - ArrayBuffer containing the .act file data
 * @returns Array of hex color strings (e.g., '#FF0000')
 */
export function parseACT(buffer: ArrayBuffer): string[] {
  const colors: string[] = [];
  const bytes = new Uint8Array(buffer);
  
  // .act files contain RGB triplets (3 bytes per color)
  for (let i = 0; i < bytes.length; i += 3) {
    const r = bytes[i];
    const g = bytes[i + 1];
    const b = bytes[i + 2];
    
    // Convert RGB to hex
    const hex = '#' + 
      r.toString(16).padStart(2, '0') +
      g.toString(16).padStart(2, '0') +
      b.toString(16).padStart(2, '0');
    
    colors.push(hex.toUpperCase());
  }
  
  return colors;
}

/**
 * Groups colors by their general hue categories
 * @param colors - Array of hex color strings
 * @returns Object with color categories
 */
export function categorizeColors(colors: string[]): Record<string, string[]> {
  const categories: Record<string, string[]> = {
    Grays: [],
    Reds: [],
    Oranges: [],
    Yellows: [],
    Greens: [],
    Cyans: [],
    Blues: [],
    Purples: [],
    Browns: [],
  };

  colors.forEach(color => {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    // Calculate HSL values
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 510; // Lightness between 0 and 1
    const d = max - min;
    const s = max === 0 ? 0 : d / max; // Saturation between 0 and 1

    let h = 0; // Hue between 0 and 360
    if (max === min) {
      h = 0;
    } else {
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h *= 60;
    }

    // Categorize based on HSL values
    if (s < 0.15) {
      categories.Grays.push(color);
    } else {
      if (h <= 20 || h > 340) categories.Reds.push(color);
      else if (h <= 45) categories.Oranges.push(color);
      else if (h <= 65) categories.Yellows.push(color);
      else if (h <= 150) categories.Greens.push(color);
      else if (h <= 200) categories.Cyans.push(color);
      else if (h <= 250) categories.Blues.push(color);
      else if (h <= 340) categories.Purples.push(color);
    }

    // Special case for browns (dark oranges/reds)
    if ((h <= 45 || h > 340) && l < 0.3) {
      categories.Browns.push(color);
    }
  });

  // Remove empty categories
  Object.keys(categories).forEach(key => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
} 