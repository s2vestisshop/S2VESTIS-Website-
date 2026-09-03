export const GENDERS = ['men', 'women', 'unisex'];
export const ROLES = ['user', 'admin'];
export const ORDER_STATUS = ['demo-placed'];

export const CATEGORY_NAMES = [
  'T-Shirts',
  'Polo',
  'Tees',
  'Shirts',
  'Linen Shirts',
  'Sportswear',
  'Sweatshirts',
  'Hoodies',
];

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const SORTS = {
  'price-asc': { effectivePrice: 1, createdAt: -1 },
  'price-desc': { effectivePrice: -1, createdAt: -1 },
  newest: { createdAt: -1 },
  popularity: { 'rating.avg': -1, 'rating.count': -1, createdAt: -1 },
};
