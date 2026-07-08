/**
 * DRW Skincare public products API client.
 *
 * The reseller storefront no longer reads the production database directly.
 * Instead it consumes the public, CORS-open catalog API documented in
 * drwskincare.com/PUBLIC_RESELLER_PRODUCTS_API.md:
 *
 *   GET https://drwskincare.com/api/public/products
 *   GET https://drwskincare.com/api/public/categories
 *
 * Only the retail price (harga umum) is exposed — internal tier prices are not.
 */

export const PUBLIC_API_BASE =
  process.env.DRW_PUBLIC_API_BASE ||
  process.env.NEXT_PUBLIC_DRW_API_BASE ||
  'https://drwskincare.com'

// Match the upstream CDN cache window (~5 min) so the storefront stays fresh
// without hammering the API on every request.
const REVALIDATE_SECONDS = 300

/** Raw item shape returned by /api/public/products */
export interface PublicItem {
  id: number | string
  type: 'product' | 'paket'
  name: string
  slug: string
  category: string | null
  price: number | null
  stok: number
  visible: boolean
  bpom: string | null
  description: string | null
  image: string | null
  images: string[]
}

export interface PublicCategory {
  id: number
  name: string
  description: string | null
}

/** Shape the storefront components expect (kept stable to avoid UI changes). */
export interface StoreProduct {
  id: string
  namaProduk: string
  deskripsi: string | null
  hargaUmum: number | null
  // Tier prices are intentionally not exposed by the public API.
  hargaConsultant: number | null
  hargaDirector: number | null
  hargaManager: number | null
  hargaSupervisor: number | null
  gambar: string | null
  fotoProduk: Array<{ url: string; alt: string | null; urutan: number }>
  slug: string
  bpom: string | null
  stok: number
  type: 'product' | 'package'
  categories: { id: string; name: string; description: string | null } | null
  packageContents: null
  detail: null
  bahanAktif: null
  createdAt: null
  updatedAt: null
}

/** Map a public API item into the shape the storefront UI consumes. */
export function mapPublicItem(item: PublicItem): StoreProduct {
  const slug = item.slug || `${item.type}-${item.id}`
  return {
    id: String(item.id),
    namaProduk: item.name,
    deskripsi: item.description ?? null,
    hargaUmum: item.price ?? null,
    hargaConsultant: null,
    hargaDirector: null,
    hargaManager: null,
    hargaSupervisor: null,
    gambar: item.image ?? (item.images?.[0] ?? null),
    fotoProduk: (item.images || []).map((url, index) => ({
      url,
      alt: item.name,
      urutan: index,
    })),
    slug,
    bpom: item.bpom ?? null,
    stok: item.stok ?? 0,
    // Public API uses "paket"; the UI uses "package".
    type: item.type === 'paket' ? 'package' : 'product',
    categories: item.category
      ? { id: item.category, name: item.category, description: null }
      : null,
    // The public catalog API does not expose bundle contents, product detail
    // (kegunaan/komposisi/cara pakai/netto) or active ingredients.
    packageContents: null,
    detail: null,
    bahanAktif: null,
    createdAt: null,
    updatedAt: null,
  }
}

interface FetchOptions {
  /** product = single products, paket = bundles, all = both */
  type?: 'product' | 'paket' | 'all'
  search?: string
  category?: string
}

/**
 * Fetch every catalog item (paging through the API) for the given filter.
 * Only `visible` items are returned (the public API default).
 */
export async function fetchAllPublic(opts: FetchOptions = {}): Promise<PublicItem[]> {
  const { type = 'all', search, category } = opts
  const limit = 100
  const all: PublicItem[] = []
  let page = 1
  let totalPages = 1

  do {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      type,
    })
    if (search) params.set('search', search)
    if (category) params.set('category', category)

    const res = await fetch(`${PUBLIC_API_BASE}/api/public/products?${params.toString()}`, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) {
      throw new Error(`Public products API returned ${res.status}`)
    }
    const json = await res.json()
    if (!json?.success) {
      throw new Error(json?.error || 'Public products API returned success=false')
    }
    all.push(...(json.data as PublicItem[]))
    totalPages = json.pagination?.totalPages ?? 1
    page += 1
  } while (page <= totalPages)

  return all
}

/** Fetch and map all storefront products/pakets for a filter. */
export async function getStoreItems(opts: FetchOptions = {}): Promise<StoreProduct[]> {
  const items = await fetchAllPublic(opts)
  return items.map(mapPublicItem)
}

/** Find a single item by slug across products + pakets (mapped). */
export async function getStoreItemBySlug(slug: string): Promise<StoreProduct | null> {
  const items = await fetchAllPublic({ type: 'all' })
  const match = items.find(
    (i) => (i.slug || `${i.type}-${i.id}`) === slug
  )
  return match ? mapPublicItem(match) : null
}

/** Fetch category list from the public API. */
export async function getCategories(): Promise<PublicCategory[]> {
  const res = await fetch(`${PUBLIC_API_BASE}/api/public/categories`, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`Public categories API returned ${res.status}`)
  const json = await res.json()
  if (!json?.success) throw new Error(json?.error || 'categories success=false')
  return json.data as PublicCategory[]
}
