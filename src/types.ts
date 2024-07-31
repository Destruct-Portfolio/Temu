export type vairant = {
  title: string;
  sku: string; // Optional
  price: number;
  compare_at_price: number;
  option1: string | null;
  option2: string | null;
  option3: string | null;
  imageSrc: string;
};
export type Image = {
  id: string;
  src: string;
};

export type Product = {
  title: string;
  description: string;
  sizes: string[];
  images: Array<Image>;
  colors: string[];
  variants: Array<vairant>;
  options: Array<any>;
  image: { src: string };
};
