import type { NextApiRequest, NextApiResponse } from 'next';
import { buildSVG } from '@nouns/sdk';
import { ImageData, getPartData } from '@nouns/assets';

const { palette } = ImageData;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { category, traitIndex } = req.body;

    if (!category || typeof traitIndex !== 'number') {
      return res.status(400).json({ error: 'Valid category and traitIndex are required' });
    }

    // Get the encoded pixels for the trait
    const encodedPixels = getPartData(category, traitIndex);

    // Build SVG with just this trait
    const svgImage = buildSVG([{ data: encodedPixels }], palette, "00000000");

    res.status(200).json({ svg: svgImage });
  } catch (error: any) {
    console.error('Error generating trait SVG:', error);
    res.status(500).json({ error: 'Error generating trait SVG', details: error.message });
  }
} 