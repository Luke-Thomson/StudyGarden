import React, { useEffect, useState } from 'react'

type GardenCell = {
    plotId: number
    plantId: number
    item: { id: number; name: string; slug: string }
    status: string
    stage: number
    plantedAt?: string | null
} | null

type GardenResponse = {
    size?: number | null
    grid: GardenCell[][]
}

const API_BASE = 'http://localhost:3333'

// 🔐 Hard-coded token for testing
const TEST_TOKEN = 'oat_Mw.WTJIMzM0U0F0TGNHbzV3WDNoWVVWMDQwOEJJakxmN1N3UjlEWnBfeDk2NjIxNTA4'

// 🌱 Seed slug to try to plant when clicking an empty tile
const TEST_SEED_SLUG = 'pineapple'

const GardenGrid: React.FC = () => {
    const [data, setData] = useState<GardenResponse | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    // ---------------------------
    // Load garden from API
    // ---------------------------
    const loadGarden = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch(`${API_BASE}/me/garden`, {
                headers: {
                    Authorization: `Bearer ${TEST_TOKEN}`,
                },
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                throw new Error(body.message || `HTTP ${res.status}`)
            }

            const json = (await res.json()) as GardenResponse
            setData(json)
        } catch (err: any) {
            setError(err.message || 'Failed to load garden')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadGarden()
    }, [])

    // ---------------------------
    // Plant seed in empty plot
    // ---------------------------
    const plantSeed = async (row: number, col: number) => {
        if (!confirm(`Plant "${TEST_SEED_SLUG}" at (${row}, ${col})?`)) return

        setBusy(true)
        try {
            const res = await fetch(`${API_BASE}/garden/plant`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ row, col, seedSlug: TEST_SEED_SLUG }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                alert(
                    `Planting failed: ${
                        (body as any).message || `HTTP ${res.status}`
                    }`
                )
                return
            }

            await loadGarden()
        } finally {
            setBusy(false)
        }
    }

    // ---------------------------
    // Harvest plant from plot
    // ---------------------------
    const harvestPlant = async (row: number, col: number) => {
        if (!confirm(`Harvest plant at (${row}, ${col})?`)) return

        setBusy(true)
        try {
            const res = await fetch(`${API_BASE}/garden/harvest`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${TEST_TOKEN}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ row, col }),
            })

            if (!res.ok) {
                const body = await res.json().catch(() => ({}))
                alert(
                    `Harvest failed: ${
                        (body as any).message || `HTTP ${res.status}`
                    }`
                )
                return
            }

            await loadGarden()
        } finally {
            setBusy(false)
        }
    }

    // ---------------------------
    // Rendering states
    // ---------------------------
    if (loading) return <div>Loading garden…</div>
    if (error) return <div style={{ color: 'red' }}>Error: {error}</div>
    if (!data || !data.grid || data.grid.length === 0) {
        return <div>No garden data</div>
    }

    // If size is null/undefined, derive it from grid length
    const size = data.size && data.size > 0 ? data.size : data.grid.length
    const flat = data.grid.flat()

    return (
        <div style={{ padding: '20px' }}>
            <h2>My Garden ({size}×{size})</h2>
            {busy && <div style={{ color: 'orange' }}>Processing…</div>}

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${size}, 100px)`,
                    gridAutoRows: '100px',
                    gap: '8px',
                    width: `${size * 100 + (size - 1) * 8}px`,
                    margin: '20px auto',
                }}
            >
                {flat.map((cell, index) => {
                    const r = Math.floor(index / size)
                    const c = index % size
                    const isEmpty = cell === null

                    return (
                        <div
                            key={index}
                            onClick={() =>
                                isEmpty ? plantSeed(r, c) : harvestPlant(r, c)
                            }
                            style={{
                                border: '2px solid #333',
                                borderRadius: '6px',
                                backgroundColor: isEmpty ? '#eee' : '#b7e6b2',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                transition: 'transform 0.1s ease',
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.transform = 'scale(1.05)')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.transform = 'scale(1)'
                                )}
                        >
                            {/* Coordinates */}
                            <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                {r},{c}
                            </div>

                            {/* Empty vs planted */}
                            {isEmpty ? (
                                <div style={{ color: '#777' }}>Empty</div>
                            ) : (
                                <>
                                    <div style={{ fontWeight: 600 }}>
                                        {cell!.item.name}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: '#444' }}>
                                        Stage {cell!.stage}
                                    </div>
                                </>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default GardenGrid
