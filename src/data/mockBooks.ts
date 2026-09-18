import { BookProduct, Collection } from '../types/shopify';

export const MOCK_GENRES: string[] = [
  'All',
  'Fiction',
  'Non-Fiction',
  'Sci-Fi & Fantasy',
  'Mystery & Thriller',
  'Philosophy',
  'Tech & Design',
  'Biography',
];

export const MOCK_COLLECTIONS: Collection[] = [
  {
    id: 'gid://shopify/Collection/1',
    handle: 'fiction',
    title: 'Fiction',
    description: 'Immersive stories, timeless classics, and literary fiction.',
    image: {
      url: 'https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=800&auto=format&fit=crop',
      altText: 'Fiction Collection',
    },
  },
  {
    id: 'gid://shopify/Collection/2',
    handle: 'non-fiction',
    title: 'Non-Fiction',
    description: 'Insightful discoveries, history, science, and essays.',
    image: {
      url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop',
      altText: 'Non-Fiction Collection',
    },
  },
  {
    id: 'gid://shopify/Collection/3',
    handle: 'sci-fi-fantasy',
    title: 'Sci-Fi & Fantasy',
    description: 'Venture beyond stars and unravel epic mythologies.',
    image: {
      url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=800&auto=format&fit=crop',
      altText: 'Sci-Fi & Fantasy Collection',
    },
  },
  {
    id: 'gid://shopify/Collection/4',
    handle: 'tech-design',
    title: 'Tech & Design',
    description: 'Master systems architecture, artificial intelligence, and visual design.',
    image: {
      url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop',
      altText: 'Tech Collection',
    },
  },
];

export const MOCK_BOOKS: BookProduct[] = [
  {
    id: 'gid://shopify/Product/1001',
    handle: 'the-design-of-everyday-things',
    title: 'The Design of Everyday Things',
    vendor: 'Don Norman',
    productType: 'Tech & Design',
    tags: ['Design', 'Bestseller', 'Cognitive Science'],
    description:
      'Even the smartest among us can feel inept as we try to figure out which joint to push or pull on a door, or which switch controls the kitchen light. In this classic book, cognitive scientist Don Norman shows how good, usable design is possible.',
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: '22.99', currencyCode: 'USD' },
      maxVariantPrice: { amount: '34.99', currencyCode: 'USD' },
    },
    images: {
      edges: [
        {
          node: {
            url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=800&auto=format&fit=crop',
            altText: 'The Design of Everyday Things Cover',
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/2001',
            title: 'Paperback',
            availableForSale: true,
            price: { amount: '22.99', currencyCode: 'USD' },
            compareAtPrice: { amount: '26.99', currencyCode: 'USD' },
          },
        },
        {
          node: {
            id: 'gid://shopify/ProductVariant/2002',
            title: 'Hardcover',
            availableForSale: true,
            price: { amount: '34.99', currencyCode: 'USD' },
            compareAtPrice: null,
          },
        },
        {
          node: {
            id: 'gid://shopify/ProductVariant/2003',
            title: 'E-Book Edition',
            availableForSale: true,
            price: { amount: '14.99', currencyCode: 'USD' },
            compareAtPrice: null,
          },
        },
      ],
    },
    rating: 4.8,
    reviewCount: 1420,
    pageCount: 368,
    isbn: '978-0465050659',
    publisher: 'Basic Books',
    publishedDate: 'November 2013',
  },
  {
    id: 'gid://shopify/Product/1002',
    handle: 'clean-architecture-craftsmans-guide',
    title: 'Clean Architecture: A Craftsman’s Guide',
    vendor: 'Robert C. Martin',
    productType: 'Tech & Design',
    tags: ['Software', 'Architecture', 'Programming'],
    description:
      'By applying universal rules of software architecture, you can dramatically improve developer productivity throughout the life of any software system. Legendary software expert Robert C. Martin reveals core design rules and practical craftsmanship.',
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: '29.50', currencyCode: 'USD' },
      maxVariantPrice: { amount: '42.00', currencyCode: 'USD' },
    },
    images: {
      edges: [
        {
          node: {
            url: 'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?q=80&w=800&auto=format&fit=crop',
            altText: 'Clean Architecture Book Cover',
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/2004',
            title: 'Paperback',
            availableForSale: true,
            price: { amount: '29.50', currencyCode: 'USD' },
            compareAtPrice: { amount: '35.00', currencyCode: 'USD' },
          },
        },
        {
          node: {
            id: 'gid://shopify/ProductVariant/2005',
            title: 'Hardcover Collector',
            availableForSale: true,
            price: { amount: '42.00', currencyCode: 'USD' },
            compareAtPrice: null,
          },
        },
      ],
    },
    rating: 4.7,
    reviewCount: 980,
    pageCount: 432,
    isbn: '978-0134494166',
    publisher: 'Prentice Hall',
    publishedDate: 'September 2017',
  },
  {
    id: 'gid://shopify/Product/1003',
    handle: 'dune-chronicles-frank-herbert',
    title: 'Dune: The Deluxe Collector’s Edition',
    vendor: 'Frank Herbert',
    productType: 'Sci-Fi & Fantasy',
    tags: ['Sci-Fi', 'Bestseller', 'Epic', 'Classics'],
    description:
      'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the "spice" melange, a drug capable of extending life and enhancing consciousness.',
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: '18.99', currencyCode: 'USD' },
      maxVariantPrice: { amount: '45.00', currencyCode: 'USD' },
    },
    images: {
      edges: [
        {
          node: {
            url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=800&auto=format&fit=crop',
            altText: 'Dune Book Cover',
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/2006',
            title: 'Deluxe Hardcover',
            availableForSale: true,
            price: { amount: '45.00', currencyCode: 'USD' },
            compareAtPrice: { amount: '50.00', currencyCode: 'USD' },
          },
        },
        {
          node: {
            id: 'gid://shopify/ProductVariant/2007',
            title: 'Paperback',
            availableForSale: true,
            price: { amount: '18.99', currencyCode: 'USD' },
            compareAtPrice: null,
          },
        },
      ],
    },
    rating: 4.9,
    reviewCount: 3840,
    pageCount: 688,
    isbn: '978-0441172719',
    publisher: 'Ace Publishing',
    publishedDate: 'August 1965',
  },
  {
    id: 'gid://shopify/Product/1004',
    handle: 'meditations-marcus-aurelius',
    title: 'Meditations: A New Translation',
    vendor: 'Marcus Aurelius (Trans. Gregory Hays)',
    productType: 'Philosophy',
    tags: ['Stoicism', 'Philosophy', 'Classics'],
    description:
      'Nearly two thousand years after it was written, this personal journal of the world’s most powerful emperor remains one of the greatest guides to spiritual resilience, wisdom, duty, and peace of mind.',
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: '14.50', currencyCode: 'USD' },
      maxVariantPrice: { amount: '26.00', currencyCode: 'USD' },
    },
    images: {
      edges: [
        {
          node: {
            url: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?q=80&w=800&auto=format&fit=crop',
            altText: 'Meditations Book Cover',
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/2008',
            title: 'Paperback',
            availableForSale: true,
            price: { amount: '14.50', currencyCode: 'USD' },
            compareAtPrice: null,
          },
        },
        {
          node: {
            id: 'gid://shopify/ProductVariant/2009',
            title: 'Faux Leather Hardcover',
            availableForSale: true,
            price: { amount: '26.00', currencyCode: 'USD' },
            compareAtPrice: { amount: '30.00', currencyCode: 'USD' },
          },
        },
      ],
    },
    rating: 4.9,
    reviewCount: 2950,
    pageCount: 256,
    isbn: '978-0812968255',
    publisher: 'Modern Library',
    publishedDate: 'May 2003',
  },
  {
    id: 'gid://shopify/Product/1005',
    handle: 'the-shadow-of-the-wind',
    title: 'The Shadow of the Wind',
    vendor: 'Carlos Ruiz Zafón',
    productType: 'Fiction',
    tags: ['Fiction', 'Mystery', 'Gothic', 'Bestseller'],
    description:
      'Barcelona, 1945: A city slowly heals from its war wounds, and Daniel, an antiquarian book dealer’s son who mourns the loss of his mother, finds solace in a mysterious book which leads him into the Cemetery of Forgotten Books.',
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: '17.99', currencyCode: 'USD' },
      maxVariantPrice: { amount: '28.00', currencyCode: 'USD' },
    },
    images: {
      edges: [
        {
          node: {
            url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800&auto=format&fit=crop',
            altText: 'The Shadow of the Wind Book Cover',
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/2010',
            title: 'Paperback',
            availableForSale: true,
            price: { amount: '17.99', currencyCode: 'USD' },
            compareAtPrice: null,
          },
        },
        {
          node: {
            id: 'gid://shopify/ProductVariant/2011',
            title: 'Hardcover',
            availableForSale: true,
            price: { amount: '28.00', currencyCode: 'USD' },
            compareAtPrice: null,
          },
        },
      ],
    },
    rating: 4.8,
    reviewCount: 1680,
    pageCount: 512,
    isbn: '978-0143034902',
    publisher: 'Penguin Books',
    publishedDate: 'January 2005',
  },
  {
    id: 'gid://shopify/Product/1006',
    handle: 'thinking-fast-and-slow',
    title: 'Thinking, Fast and Slow',
    vendor: 'Daniel Kahneman',
    productType: 'Non-Fiction',
    tags: ['Psychology', 'Economics', 'Non-Fiction', 'Bestseller'],
    description:
      'The international bestseller that changed the way we think about thinking. Daniel Kahneman, the renowned psychologist and winner of the Nobel Prize in Economics, takes us on a groundbreaking tour of the mind and explains the two systems that drive the way we think.',
    availableForSale: true,
    priceRange: {
      minVariantPrice: { amount: '19.99', currencyCode: 'USD' },
      maxVariantPrice: { amount: '32.50', currencyCode: 'USD' },
    },
    images: {
      edges: [
        {
          node: {
            url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=800&auto=format&fit=crop',
            altText: 'Thinking, Fast and Slow Book Cover',
          },
        },
      ],
    },
    variants: {
      edges: [
        {
          node: {
            id: 'gid://shopify/ProductVariant/2012',
            title: 'Paperback',
            availableForSale: true,
            price: { amount: '19.99', currencyCode: 'USD' },
            compareAtPrice: { amount: '22.00', currencyCode: 'USD' },
          },
        },
      ],
    },
    rating: 4.7,
    reviewCount: 4210,
    pageCount: 512,
    isbn: '978-0374533557',
    publisher: 'Farrar, Straus and Giroux',
    publishedDate: 'April 2013',
  },
];
