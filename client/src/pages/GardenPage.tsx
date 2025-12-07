import React, { useEffect, useState } from "react";
import api from "../api";

type GardenCell =
    | {
    plotId: number;
    plantId: number;
    item: { id: number; name: string; slug: string };
    status: string; // e.g. "empty" | "growing" | "ready"
    stage: number;
    plantedAt?: string | null;
}
    | null;

type GardenResponse = {
    grid: GardenCell[][];
};

type InventorySeed = {
    slug: string;
    name: string;
    quantity: number;
};

type InventoryItem = {
    item: {
        slug: string;
        name: string;
        type?: string;
        description?: string | null;
        price?: number;
    };
    quantity: number;
};

interface GardenPageProps {
    token: string;
    onWalletRefresh: () => Promise<void>;
}

const GardenPage: React.FC<GardenPageProps> = ({ token, onWalletRefresh }) => {
    const [data, setData] = useState<GardenResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [seeds, setSeeds] = useState<InventorySeed[]>([]);
    const [selectedSeed, setSelectedSeed] = useState<string>("");

    const [message, setMessage] = useState<string | null>(null);

    const [shopItems, setShopItems] = useState<any[]>([]);
    const [purchaseSlug, setPurchaseSlug] = useState<string>("");
    const [purchaseQty, setPurchaseQty] = useState<number>(1);

    const [openPackSlug, setOpenPackSlug] = useState<string>("");
    const [lastRewards, setLastRewards] = useState<string | null>(null);

    // ---- LOADERS ----

    const loadGarden = async () => {
        setLoading(true);
        setError(null);
        try {
            const json = await api.garden(token);
            setData(json);
        } catch (err: any) {
            setError(err?.message || "Failed to load garden");
        } finally {
            setLoading(false);
        }
    };

    const loadInventory = async () => {
        try {
            const holdings = await api.inventory(token);
            setInventory(holdings || []);

            const availableSeeds: InventorySeed[] = (holdings || [])
                .filter((i: any) => i?.item?.type === "seed")
                .map((i: any) => ({
                    slug: i.item.slug,
                    name: i.item.name,
                    quantity: i.quantity,
                }));

            setSeeds(availableSeeds);

            if (availableSeeds.length > 0 && !selectedSeed) {
                setSelectedSeed(availableSeeds[0].slug);
            }

            const pack = (holdings || []).find(
                (i: any) => i?.item?.type === "seed_pack"
            );
            if (pack && !openPackSlug) {
                setOpenPackSlug(pack.item.slug);
            }
        } catch (err: any) {
            setMessage(err?.message ?? "Unable to load inventory");
        }
    };

    const loadShop = async () => {
        try {
            const items = await api.items(token);
            setShopItems(items || []);

            if (!purchaseSlug && items && items.length > 0) {
                setPurchaseSlug(items[0].slug);
            }
        } catch (err: any) {
            setMessage(err?.message ?? "Unable to load shop");
        }
    };

    useEffect(() => {
        loadGarden();
        loadInventory();
        loadShop();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // ---- ACTIONS ----

    const plantSeed = async (row: number, col: number) => {
        if (!selectedSeed) {
            setMessage("Select a seed to plant first.");
            return;
        }
        setBusy(true);
        setMessage(null);
        try {
            await api.plant(token, row, col, selectedSeed);
            setMessage("Planted!");
            await loadGarden();
            await loadInventory();
        } catch (err: any) {
            setMessage(err?.message ?? "Planting failed");
        } finally {
            setBusy(false);
        }
    };

    const harvestPlant = async (row: number, col: number) => {
        setBusy(true);
        setMessage(null);
        try {
            const res = await api.harvest(token, row, col);
            setMessage(
                res?.coinsAwarded
                    ? `Harvested! +${res.coinsAwarded} coins`
                    : "Harvested!"
            );
            await loadGarden();
            await onWalletRefresh();
        } catch (err: any) {
            setMessage(err?.message ?? "Harvest failed");
        } finally {
            setBusy(false);
        }
    };

    const purchaseItem = async () => {
        if (!purchaseSlug) {
            setMessage("Choose an item to buy.");
            return;
        }
        setBusy(true);
        setMessage(null);
        try {
            const qty = Math.max(1, purchaseQty);
            await api.purchaseItem(token, purchaseSlug, qty);
            setMessage(`Purchased ${qty} × ${purchaseSlug}`);
            await loadInventory();
            await onWalletRefresh();
        } catch (err: any) {
            setMessage(err?.message ?? "Purchase failed");
        } finally {
            setBusy(false);
        }
    };

    const openPack = async () => {
        if (!openPackSlug) {
            setMessage("No pack selected to open.");
            return;
        }
        setBusy(true);
        setMessage(null);
        setLastRewards(null);
        try {
            const res = await api.openPack(token, openPackSlug);
            const rewards = Array.isArray(res?.items)
                ? res.items
                    .map(
                        (r: any) =>
                            `${r.quantity ?? 1}× ${
                                r.item?.name ?? r.item?.slug ?? "item"
                            }`
                    )
                    .join(", ")
                : null;

            setLastRewards(rewards || null);
            setMessage(res?.message ?? `Opened ${openPackSlug}!`);
            await loadInventory();
            await onWalletRefresh();
        } catch (err: any) {
            setMessage(err?.message ?? "Unable to open pack");
        } finally {
            setBusy(false);
        }
    };

    // ---- RENDER ----

    if (loading) return <div>Loading garden…</div>;
    if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
    if (!data || !data.grid || data.grid.length === 0) {
        return <div>No garden data</div>;
    }

    const size = data.grid.length;

    return (
        <div style={{ padding: "20px" }}>
            {/* Header + seed selection */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                }}
            >
                <h2>
                    My Garden ({size}×{size})
                </h2>

                <div>
                    <label
                        htmlFor="seed-select"
                        style={{ marginRight: "8px", fontWeight: 600 }}
                    >
                        Seed to plant
                    </label>
                    <select
                        id="seed-select"
                        value={selectedSeed}
                        onChange={(e) => setSelectedSeed(e.target.value)}
                        disabled={seeds.length === 0}
                    >
                        {seeds.length === 0 && <option value="">No seeds</option>}
                        {seeds.map((s) => (
                            <option key={s.slug} value={s.slug}>
                                {s.name} (x{s.quantity})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Status message */}
            {message && (
                <div
                    style={{
                        marginBottom: "16px",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        background: "#f3f7ff",
                        border: "1px solid #d0ddff",
                        fontSize: "0.9rem",
                    }}
                >
                    {message}
                </div>
            )}

            {/* Garden grid */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${size}, 90px)`,
                    gap: "8px",
                    marginBottom: "24px",
                }}
            >
                {data.grid.map((row, r) =>
                    row.map((cell, c) => {
                        const isEmpty = !cell;
                        const canHarvest = !isEmpty;
                        const canPlant = isEmpty;

                        return (
                            <button
                                key={`${r}-${c}`}
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                    if (canHarvest) {
                                        harvestPlant(r, c);
                                    } else if (canPlant) {
                                        plantSeed(r, c);
                                    }
                                }}
                                style={{
                                    background: isEmpty
                                        ? "#f9f9f9"
                                        : canHarvest
                                            ? "#e3f6d7"
                                            : "#def0ff",
                                    border: "1px solid #ccc",
                                    borderRadius: "8px",
                                    padding: "8px",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: busy ? "not-allowed" : "pointer",
                                    fontSize: "0.8rem",
                                    transition: "transform 0.1s ease",
                                    opacity: busy ? 0.6 : 1,
                                }}
                                onMouseEnter={(e) =>
                                    (e.currentTarget.style.transform = "scale(1.05)")
                                }
                                onMouseLeave={(e) =>
                                    (e.currentTarget.style.transform = "scale(1)")
                                }
                            >
                                <div style={{ fontWeight: 600, marginBottom: "4px" }}>
                                    {r},{c}
                                </div>
                                {isEmpty ? (
                                    <div style={{ color: "#777" }}>Empty</div>
                                ) : (
                                    <>
                                        <div style={{ fontWeight: 600 }}>{cell!.item.name}</div>
                                        <div style={{ fontSize: "0.7rem", color: "#444" }}>
                                            Stage {cell!.stage} ({cell!.status})
                                        </div>
                                    </>
                                )}
                                {!isEmpty && (
                                    <div
                                        style={{
                                            marginTop: "4px",
                                            fontSize: "0.7rem",
                                            color: "#333",
                                        }}
                                    >
                                        {canHarvest
                                            ? "Click to harvest"
                                            : canPlant
                                                ? "Click to plant"
                                                : "Growing…"}
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

            {/* Side panels: Inventory, Shop, Packs */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "16px",
                }}
            >
                {/* Inventory */}
                <section
                    style={{
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        padding: "12px",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Inventory</h3>
                    {inventory.length === 0 ? (
                        <div style={{ color: "#666" }}>No items yet.</div>
                    ) : (
                        <ul
                            style={{
                                listStyle: "none",
                                padding: 0,
                                margin: 0,
                                display: "grid",
                                gap: "6px",
                            }}
                        >
                            {inventory.map((entry) => (
                                <li
                                    key={entry.item.slug}
                                    style={{
                                        background: "#f8f8f8",
                                        border: "1px solid #e0e0e0",
                                        borderRadius: "6px",
                                        padding: "8px",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            fontWeight: 600,
                                        }}
                                    >
                                        <span>{entry.item.name}</span>
                                        <span>x{entry.quantity}</span>
                                    </div>
                                    <div style={{ fontSize: "0.85rem", color: "#555" }}>
                                        {entry.item.type ?? "item"}
                                    </div>
                                    {entry.item.description && (
                                        <div style={{ fontSize: "0.8rem", color: "#666" }}>
                                            {entry.item.description}
                                        </div>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Shop */}
                <section
                    style={{
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        padding: "12px",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Shop</h3>
                    {shopItems.length === 0 ? (
                        <div style={{ color: "#666" }}>No shop items found.</div>
                    ) : (
                        <div style={{ display: "grid", gap: "8px" }}>
                            <div
                                style={{ display: "flex", gap: "8px", alignItems: "center" }}
                            >
                                <label htmlFor="shop-select" style={{ fontWeight: 600 }}>
                                    Item
                                </label>
                                <select
                                    id="shop-select"
                                    value={purchaseSlug}
                                    onChange={(e) => setPurchaseSlug(e.target.value)}
                                    style={{ flex: 1 }}
                                >
                                    {shopItems.map((item) => (
                                        <option key={item.slug} value={item.slug}>
                                            {item.name} ({item.price ?? 0} coins)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div
                                style={{ display: "flex", gap: "8px", alignItems: "center" }}
                            >
                                <label htmlFor="purchase-qty" style={{ fontWeight: 600 }}>
                                    Qty
                                </label>
                                <input
                                    id="purchase-qty"
                                    type="number"
                                    min={1}
                                    value={purchaseQty}
                                    onChange={(e) =>
                                        setPurchaseQty(Number(e.target.value) || 1)
                                    }
                                    style={{ width: "90px" }}
                                />
                                <button type="button" onClick={purchaseItem} disabled={busy}>
                                    {busy ? "Working…" : "Buy"}
                                </button>
                            </div>

                            <div style={{ fontSize: "0.85rem", color: "#555" }}>
                                Use your study coins to purchase seeds or packs.
                            </div>
                        </div>
                    )}
                </section>

                {/* Packs */}
                <section
                    style={{
                        border: "1px solid #ccc",
                        borderRadius: "8px",
                        padding: "12px",
                    }}
                >
                    <h3 style={{ marginTop: 0 }}>Open a Pack</h3>
                    <div
                        style={{ display: "flex", gap: "8px", alignItems: "center" }}
                    >
                        <select
                            value={openPackSlug}
                            onChange={(e) => setOpenPackSlug(e.target.value)}
                            style={{ flex: 1 }}
                        >
                            <option value="">Select pack</option>
                            {inventory
                                .filter((i) => i.item.type === "seed_pack")
                                .map((pack) => (
                                    <option key={pack.item.slug} value={pack.item.slug}>
                                        {pack.item.name} (x{pack.quantity})
                                    </option>
                                ))}
                        </select>
                        <button
                            type="button"
                            onClick={openPack}
                            disabled={busy || !openPackSlug}
                        >
                            {busy ? "Opening…" : "Open"}
                        </button>
                    </div>
                    {lastRewards && (
                        <div style={{ marginTop: "8px", color: "#234016" }}>
                            Rewards: {lastRewards}
                        </div>
                    )}
                    <div
                        style={{
                            fontSize: "0.85rem",
                            color: "#555",
                            marginTop: "6px",
                        }}
                    >
                        Opening a pack consumes it and grants random seeds.
                    </div>
                </section>
            </div>
        </div>
    );
};

export default GardenPage;
