import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import "./GardenPage.css";
type GardenCell = {
    plotId: number;
    plantId: number;
    item: { id: number; name: string; slug: string };
    status: string;
    stage: number;
    plantedAt?: string | null;
} | null;
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
type ShopItem = {
    slug: string;
    name: string;
    description?: string | null;
    price?: number;
    type?: string;
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
    const [selectedSeed, setSelectedSeed] = useState<string>("");
    const [draggingSeed, setDraggingSeed] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [shopFilter, setShopFilter] = useState<"all" | "seed" | "seed_pack">("all");
    const [purchaseSlug, setPurchaseSlug] = useState<string>("");
    const [purchaseQty, setPurchaseQty] = useState<number>(1);
    const [openPackSlug, setOpenPackSlug] = useState<string>("");
    const [lastRewards, setLastRewards] = useState<string | null>(null);
    const [confirmingItem, setConfirmingItem] = useState<ShopItem | null>(null);
    const [packRewardsModal, setPackRewardsModal] = useState<string[] | null>(null);
    const [openingAnimation, setOpeningAnimation] = useState(false);
    const seeds: InventorySeed[] = useMemo(() => {
        return (inventory || [])
            .filter((i) => i?.item?.type === "seed")
            .map((i) => ({ slug: i.item.slug, name: i.item.name, quantity: i.quantity }));
    }, [inventory]);
    const packs = useMemo(
        () => inventory.filter((i) => i?.item?.type === "seed_pack"),
        [inventory]
    );

    const filteredShopItems = useMemo(() => {
        if (shopFilter === "all") return shopItems;
        return shopItems.filter((item) => item.type === shopFilter);
    }, [shopFilter, shopItems]);

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
        } catch (err: any) {
            setMessage(err?.message ?? "Unable to load inventory");
        }
    };
    const loadShop = async () => {
        try {
            const items = await api.items(token);
            setShopItems(items || []);
        } catch (err: any) {
            setMessage(err?.message ?? "Unable to load shop");
        }
    };
    useEffect(() => {
        loadGarden();
        loadInventory();
        loadShop();
    }, [token]);
    const plantSeed = async (row: number, col: number, seedSlug?: string) => {
        const slugToUse = seedSlug || selectedSeed;
        if (!slugToUse) {
            setMessage("Select a seed to plant first.");
            return;
        }
        setBusy(true);
        setMessage(null);
        try {
            await api.plant(token, row, col, slugToUse);
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
            setMessage(res?.coinsAwarded ? `Harvested! +${res.coinsAwarded} coins` : "Harvested!");
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
            return false;
        }
        setBusy(true);
        setMessage(null);
        try {
            const qty = Math.max(1, purchaseQty);
            await api.purchaseItem(token, purchaseSlug, qty);
            setMessage(`Purchased ${qty} × ${purchaseSlug}`);
            await loadInventory();
            await onWalletRefresh();
            return true;
        } catch (err: any) {
            setMessage(err?.message ?? "Purchase failed");
            return false;
        } finally {
            setBusy(false);
        }
    };
    const openPack = async () => {
        if (!openPackSlug) {
            setMessage("No pack selected to open.");
            return false;
        }
        setBusy(true);
        setMessage(null);
        setLastRewards(null);
        setOpeningAnimation(true);
        try {
            const res = await api.openPack(token, openPackSlug);
            const payload: any = (res as any)?.body ?? res ?? {};
            const responseItems = Array.isArray(res?.items)
                ? res.items
                : Array.isArray(payload?.items)
                    ? payload.items
                    : null;

            const rewardsList = responseItems
                ? responseItems.map((r: any) => `${r.quantity ?? 1}× ${r.item?.name ?? r.item?.slug ?? "item"}`)
                : [];

            if (!rewardsList.length && payload?.seed) {
                rewardsList.push(`1× ${payload.seed}`);
            }

            if (payload?.newlyUnlocked) {
                rewardsList.push("New seed unlocked!");
            }

            if (!rewardsList.length && payload?.pack) {
                rewardsList.push(`Opened ${payload.pack}`);
            }
            const fallbackMessage =
                res?.message && res.message !== "Pack opened!"
                    ? res.message
                    : "Check your inventory for the new pulls.";
            const rewards = rewardsList.length ? rewardsList : [fallbackMessage];
            setLastRewards(rewards.join(", "));
            setPackRewardsModal(rewards);
            setMessage(res?.message ?? payload?.message ?? `Opened ${payload?.pack ?? openPackSlug}!`);
            await loadInventory();
            await onWalletRefresh();
            return true;
        } catch (err: any) {
            setMessage(err?.message ?? "Unable to open pack");
            return false;
        } finally {
            setBusy(false);
            setTimeout(() => setOpeningAnimation(false), 600);
        }
    };
    const handleDrop = (row: number, col: number) => {
        if (busy) return;
        plantSeed(row, col, draggingSeed || selectedSeed);
        setDraggingSeed(null);
    };
    const handlePurchaseConfirm = (item: ShopItem) => {
        setPurchaseSlug(item.slug);
        setPurchaseQty(1);
        setConfirmingItem(item);
    };
    const confirmPurchaseAndBuy = async () => {
        const success = await purchaseItem();
        if (success) {
            setConfirmingItem(null);
        }
    };
    const handlePackDoubleClick = async (slug: string) => {
        if (busy) return;
        setOpenPackSlug(slug);
        setPackRewardsModal(null);
        await openPack();
    };
    useEffect(() => {
        if (seeds.length > 0 && !selectedSeed) {
            setSelectedSeed(seeds[0].slug);
        }
        if (packs.length > 0 && !openPackSlug) {
            setOpenPackSlug(packs[0].item.slug);
        }
    }, [seeds, packs, selectedSeed, openPackSlug]);

    useEffect(() => {
        if (filteredShopItems.length === 0) return;
        const stillVisible = filteredShopItems.some((item) => item.slug === purchaseSlug);
        if (!purchaseSlug || !stillVisible) {
            setPurchaseSlug(filteredShopItems[0].slug);
        }
    }, [filteredShopItems, purchaseSlug]);

    if (loading) return <div>Loading garden…</div>;
    if (error) return <div style={{ color: "red" }}>Error: {error}</div>;
    if (!data || !data.grid || data.grid.length === 0) {
        return <div>No garden data</div>;
    }
    const size = data.grid.length;
    const flat = data.grid.flat();
    return (
        <div className="garden-page">
            <div className="garden-header">
                <div>
                    <h2>My Garden ({size}×{size})</h2>
                    <p className="garden-subtitle">
                        Drag seeds onto tiles to plant, click planted tiles to harvest, and double-click items for quick
                        actions.
                    </p>
                </div>
                <div className="seed-selector">
                    <label htmlFor="seed-select">Quick seed</label>
                    <select
                        id="seed-select"
                        value={selectedSeed}
                        onChange={(e) => setSelectedSeed(e.target.value)}
                        disabled={seeds.length === 0}
                    >
                        {seeds.length === 0 && <option value="">No seeds</option>}
                        {seeds.map((s) => (
                            <option key={s.slug} value={s.slug}>
                                {s.name} ({s.quantity})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            {busy && <div className="status status-busy">Processing…</div>}
            {message && <div className="status status-message">{message}</div>}
            <div
                className="garden-grid"
                style={{ gridTemplateColumns: `repeat(${size}, minmax(80px, 1fr))` }}
            >
                {flat.map((cell, index) => {
                    const r = Math.floor(index / size);
                    const c = index % size;
                    const isEmpty = cell === null;
                    return (
                        <div
                            key={`${r}-${c}`}
                            className={`garden-cell ${isEmpty ? "empty" : "planted"} ${
                                draggingSeed && isEmpty ? "hover" : ""
                            }`}
                            onClick={() => (isEmpty ? plantSeed(r, c) : harvestPlant(r, c))}
                            onDoubleClick={() => (!isEmpty ? harvestPlant(r, c) : plantSeed(r, c))}
                            onDragOver={(e) => {
                                if (isEmpty) e.preventDefault();
                            }}
                            onDrop={(e) => {
                                e.preventDefault();
                                if (!isEmpty) return;
                                handleDrop(r, c);
                            }}
                        >
                            <div className="cell-coord">
                                {r},{c}
                            </div>
                            {isEmpty ? (
                                <div className="cell-empty">{draggingSeed ? "Drop seed" : "Empty"}</div>
                            ) : (
                                <div className="cell-plant">
                                    <div className="cell-plant-name">{cell!.item.name}</div>
                                    <div className="cell-plant-stage">Stage {cell!.stage}</div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="garden-panels">
                <section className="panel inventory-panel">
                    <header>
                        <div>
                            <h3>Seeds</h3>
                            <p className="panel-subtitle">Drag and drop onto empty tiles.</p>
                        </div>
                    </header>
                    {seeds.length === 0 ? (
                        <div className="muted">No seeds yet.</div>
                    ) : (
                        <div className="card-grid">
                            {seeds.map((seed) => (
                                <div
                                    key={seed.slug}
                                    className={`card seed-card ${draggingSeed === seed.slug ? "dragging" : ""}`}
                                    draggable
                                    onDragStart={() => {
                                        setDraggingSeed(seed.slug);
                                        setSelectedSeed(seed.slug);
                                    }}
                                    onDragEnd={() => setDraggingSeed(null)}
                                >
                                    <div className="card-top">
                                        <span className="card-title">{seed.name}</span>
                                        <span className="pill">x{seed.quantity}</span>
                                    </div>
                                    <div className="card-body">
                                        <p>Grab and drop to plant.</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                <section className="panel inventory-panel">
                    <header>
                        <div>
                            <h3>Seed Packs</h3>
                            <p className="panel-subtitle">Double-click to crack open.</p>
                        </div>
                    </header>
                    {packs.length === 0 ? (
                        <div className="muted">No packs collected.</div>
                    ) : (
                        <div className="card-grid">
                            {packs.map((pack) => (
                                <div
                                    key={pack.item.slug}
                                    className={`card pack-card ${openingAnimation && openPackSlug === pack.item.slug ? "opening" : ""}`}
                                    onDoubleClick={() => handlePackDoubleClick(pack.item.slug)}
                                >
                                    <div className="card-top">
                                        <span className="card-title">{pack.item.name}</span>
                                        <span className="pill">x{pack.quantity}</span>
                                    </div>
                                    <div className="card-body">
                                        <p>Double-click to open for a surprise.</p>
                                        {lastRewards && openPackSlug === pack.item.slug && (
                                            <p className="muted">Last opened: {lastRewards}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
                <section className="panel shop-panel">
                    <header>
                        <div>
                            <h3>Shop</h3>
                            <p className="panel-subtitle">Double-click an item to buy.</p>
                        </div>
                        <div className="shop-tabs" role="tablist">
                            <button
                                type="button"
                                className={`tab ${shopFilter === "all" ? "active" : ""}`}
                                onClick={() => setShopFilter("all")}
                                role="tab"
                                aria-selected={shopFilter === "all"}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                className={`tab ${shopFilter === "seed" ? "active" : ""}`}
                                onClick={() => setShopFilter("seed")}
                                role="tab"
                                aria-selected={shopFilter === "seed"}
                            >
                                Seeds
                            </button>
                            <button
                                type="button"
                                className={`tab ${shopFilter === "seed_pack" ? "active" : ""}`}
                                onClick={() => setShopFilter("seed_pack")}
                                role="tab"
                                aria-selected={shopFilter === "seed_pack"}
                            >
                                Packs
                            </button>
                        </div>
                    </header>
                    {filteredShopItems.length === 0 ? (
                        <div className="muted">No items in this category.</div>
                    ) : (
                        <div className="card-grid">
                            {filteredShopItems.map((item) => (
                                <div
                                    key={item.slug}
                                    className="card shop-card"
                                    onDoubleClick={() => handlePurchaseConfirm(item)}
                                >
                                    <div className="card-top">
                                        <span className="card-title">{item.name}</span>
                                        <span className="pill price">{item.price ?? 0} coins</span>
                                    </div>
                                    <div className="card-body">
                                        <p>{item.description || "Stocked for adventurous gardeners."}</p>
                                        <button
                                            type="button"
                                            className="ghost-button"
                                            onClick={() => handlePurchaseConfirm(item)}
                                        >
                                            Buy
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
            {confirmingItem && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal">
                        <h4>Purchase {confirmingItem.name}?</h4>
                        <p className="muted">Double-check the quantity before spending your coins.</p>
                        <div className="modal-row">
                            <label htmlFor="purchase-qty">Quantity</label>
                            <input
                                id="purchase-qty"
                                type="number"
                                min={1}
                                value={purchaseQty}
                                onChange={(e) => setPurchaseQty(Number(e.target.value) || 1)}
                            />
                        </div>
                        <div className="modal-actions">
                            <button type="button" onClick={() => setConfirmingItem(null)}>
                                Cancel
                            </button>
                            <button type="button" className="primary" onClick={confirmPurchaseAndBuy} disabled={busy}>
                                {busy ? "Buying…" : "Confirm"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {packRewardsModal && (
                <div className="modal-backdrop" role="dialog" aria-modal="true">
                    <div className="modal">
                        <h4>Pack opened!</h4>
                        <p className="muted">You pulled:</p>
                        <div className="reward-list">
                            {packRewardsModal.map((reward, idx) => (
                                <div key={`${reward}-${idx}`} className="reward-row">
                                    {reward}
                                </div>
                            ))}
                        </div>
                        <div className="modal-actions">
                            <button type="button" className="primary" onClick={() => setPackRewardsModal(null)}>
                                Nice!
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {openingAnimation && (
                <div className="pack-opening">
                    <div className="sparkle" />
                    <div className="sparkle delay" />
                    <div className="sparkle" />
                    <p>Ripping open the pack…</p>
                </div>
            )}
        </div>
    );
};
export default GardenPage;