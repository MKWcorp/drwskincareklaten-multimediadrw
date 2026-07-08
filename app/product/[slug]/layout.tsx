import { Metadata } from 'next'
import { SITE_CONFIG, getPageUrl, getCanonicalUrl } from '../../../lib/site-config'
import { getStoreItemBySlug, getStoreItems, type StoreProduct } from '@/lib/publicApi'

// Revalidate metadata/static params on the ~5 min public API window.
export const revalidate = 300

async function fetchProduct(slug: string): Promise<StoreProduct | null> {
  try {
    return await getStoreItemBySlug(slug)
  } catch (error) {
    console.error('Error fetching product for metadata:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const product = await fetchProduct(params.slug);
  if (!product) {
    return {
      title: `Produk Tidak Ditemukan - ${SITE_CONFIG.business.name}`,
      description: `Produk yang Anda cari tidak ditemukan di ${SITE_CONFIG.business.name}.`,
    };
  }
  const productImageRelative = product.gambar || product.fotoProduk?.[0]?.url || SITE_CONFIG.images.logoSquare;
  // Ensure absolute URL for Open Graph
  const productImage = productImageRelative.startsWith('http') 
    ? productImageRelative 
    : `${SITE_CONFIG.website.baseUrl}${productImageRelative}`;
    
  const productPrice = product.hargaUmum 
    ? new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(product.hargaUmum)
    : 'Hubungi Kami';
  const title = `${product.namaProduk} - ${productPrice} | Produk Kecantikan Skincare ${SITE_CONFIG.business.name}`;
  const description = product.deskripsi 
    ? `${product.deskripsi} - Produk Kecantikan Skincare ${SITE_CONFIG.business.name} dengan formula dokter, harga ${productPrice}. ${product.bpom ? `BPOM: ${product.bpom}` : ''} Produk skincare profesional untuk hasil optimal.`
    : `${product.namaProduk} - Produk Kecantikan Skincare ${SITE_CONFIG.business.name} dengan formula dokter, harga ${productPrice}. Produk skincare profesional dengan kualitas terjamin dan hasil optimal.`;

  return {
    title,
    description,    keywords: `${product.namaProduk}, ${SITE_CONFIG.seo.keywords.product}, ${product.bpom ? `BPOM ${product.bpom}` : ''}`,
    metadataBase: new URL(SITE_CONFIG.website.baseUrl),
    openGraph: {
      title,
      description,
      images: [        {
          url: productImage,
          width: 800,
          height: 600,
          alt: `${product.namaProduk} - ${SITE_CONFIG.business.name}`,
        },
      ],
      type: 'website',
      siteName: SITE_CONFIG.business.name,
      url: getPageUrl(`/product/${params.slug}`),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [productImage],
    },    alternates: {
      canonical: getCanonicalUrl(`/product/${params.slug}`),
    },
  };
}

// Generate static params for better performance
export async function generateStaticParams() {
  try {
    const items = await getStoreItems({ type: 'all' })
    return items.map((product) => ({ slug: product.slug }))
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}