export interface ClothRecommendationType {
  baseStyle: string;
  description: string;
  items: ClothItem[];
}

export interface ClothItem {
  name: string;
  description: string;
  keywords: string[];
}

export interface StyleSegmentation {
  baseStyle: string;
  segment: string;
  segmentConfidence: string;
  description: string;
  items: StyleSegmentationItem[];
}

export interface StyleSegmentationItem {
  name: string;
  description: string;
  keywords: string[];
  searchQuery: string;
  categoryId: string;
  subcategoryId: string;
}
