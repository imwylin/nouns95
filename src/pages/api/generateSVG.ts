import type { NextApiRequest, NextApiResponse } from 'next';
import { buildSVG } from '@nouns/sdk';
import { ImageData } from '@nouns/assets';

const { bgcolors, palette, images } = ImageData;
const { bodies, accessories, heads, glasses } = images;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { seed } = req.body;

    // Add debug logging
    console.log('Received seed:', seed);

    if (!seed || typeof seed !== 'object') {
      console.error('Invalid seed in the request body');
      return res.status(400).json({ error: 'Valid seed object is required' });
    }

    const svgParts = [
      { data: bodies[seed.body].data },
      { data: accessories[seed.accessory].data },
      { data: heads[seed.head].data },
      { data: glasses[seed.glasses].data },
    ];

    const background = bgcolors[seed.background];
    const svgImage = buildSVG(svgParts, palette, background);

    res.status(200).json({ svg: svgImage });
  } catch (error: any) {
    console.error('Error generating SVG:', error);
    res
      .status(500)
      .json({ error: 'Error generating SVG', details: error.message });
  }
}