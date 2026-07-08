import { NextRequest, NextResponse } from 'next/server'
import { getStoreItems, getStoreItemBySlug } from '@/lib/publicApi'

// Bundles ("paket") sourced from the drwskincare.com public catalog API.
// Varies by query param; upstream fetch is cached ~5 min in lib/publicApi.ts.
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const slug = searchParams.get('slug')

    if (slug) {
      const item = await getStoreItemBySlug(slug)
      // Only return it here if it is actually a package.
      const data = item && item.type === 'package' ? [item] : []
      return NextResponse.json({ success: true, data })
    }

    const data = await getStoreItems({ type: 'paket' })
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch packages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
