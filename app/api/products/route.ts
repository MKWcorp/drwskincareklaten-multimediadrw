import { NextRequest, NextResponse } from 'next/server'
import { getStoreItems, getStoreItemBySlug } from '@/lib/publicApi'

// Data comes from the drwskincare.com public catalog API (see lib/publicApi.ts).
// Varies by query param, so render on demand; the upstream fetch itself is
// cached ~5 min (see lib/publicApi.ts revalidate).
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const slug = searchParams.get('slug')
    // 'products' (default) | 'packages' | 'all'
    const type = searchParams.get('type')

    if (slug) {
      const product = await getStoreItemBySlug(slug)
      return NextResponse.json({
        success: true,
        data: product ? [product] : [],
      })
    }

    const wanted =
      type === 'packages' ? 'paket' : type === 'all' ? 'all' : 'product'

    const data = await getStoreItems({ type: wanted })

    const totalProducts = data.filter((i) => i.type === 'product').length
    const totalPackages = data.filter((i) => i.type === 'package').length

    return NextResponse.json({
      success: true,
      data,
      meta: {
        totalProducts,
        totalPackages,
        total: data.length,
      },
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
