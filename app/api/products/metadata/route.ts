import { NextRequest, NextResponse } from 'next/server';
import { getStoreItemBySlug } from '@/lib/publicApi';
import { SITE_CONFIG, getPageUrl } from '../../../../lib/site-config';

// SEO metadata for a single product/paket, sourced from the public catalog API.
// Varies by slug query param; upstream fetch is cached ~5 min in lib/publicApi.ts.
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (!slug) {
      return NextResponse.json({
        success: false,
        error: 'Slug is required'
      }, { status: 400 });
    }

    const product = await getStoreItemBySlug(slug);

    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product not found'
      }, { status: 404 });
    }

    // Generate metadata for the product
    const productImage =
      product.gambar || product.fotoProduk?.[0]?.url || '/logo_drwskincare_square.png';
    const productPrice = product.hargaUmum
      ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
        }).format(Number(product.hargaUmum))
      : 'Hubungi Kami';

    const title = `${product.namaProduk} - ${productPrice} | ${SITE_CONFIG.business.name}`;
    const description = product.deskripsi
      ? `${product.deskripsi} - Produk skincare berkualitas dari ${SITE_CONFIG.business.name} dengan harga ${productPrice}. ${product.bpom ? `BPOM: ${product.bpom}` : ''}`
      : `${product.namaProduk} - Produk skincare berkualitas dari ${SITE_CONFIG.business.name} dengan harga ${productPrice}. Konsultasi gratis dengan dokter berpengalaman.`;

    const metadata = {
      title,
      description,
      image: productImage,
      url: getPageUrl(`/product/${slug}`),
      keywords: `${product.namaProduk}, skincare, ${SITE_CONFIG.business.name}, produk kecantikan, perawatan kulit, ${product.bpom ? `BPOM ${product.bpom}` : ''}`,
      price: productPrice,
      bpom: product.bpom,
      category: product.categories?.name || 'Skincare'
    };

    return NextResponse.json({
      success: true,
      data: {
        product,
        metadata
      }
    });

  } catch (error) {
    console.error('Error fetching product metadata:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
