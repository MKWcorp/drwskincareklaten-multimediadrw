import { NextResponse } from 'next/server'
import { getStoreItems } from '@/lib/publicApi'

// First 8 products from the drwskincare.com public catalog API.
export const revalidate = 300

export async function GET() {
  try {
    const products = await getStoreItems({ type: 'product' })
    return NextResponse.json({
      success: true,
      data: products.slice(0, 8),
    })
  } catch (error) {
    console.error('Error fetching featured products:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch featured products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
