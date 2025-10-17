export interface Category {
  id: number;
  name: string;
  hasChildren: boolean;
  url: string;
  children: Category[];
  Title: string;
  MetaTagDescription: string;
}
