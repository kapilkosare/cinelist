import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
  title?: string;
  rating?: number;
  tags?: string[];
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;
