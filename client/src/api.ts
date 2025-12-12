import type { LeaderboardRange, SessionTotals, StudyLeaderboardResponse } from "./types"
const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3333'
export type TimerMode = 'STUDY' | 'BREAK_SHORT' | 'BREAK_LONG'

export interface LoginResult {
    type?: string
    token: string
}

async function handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
        let message = `HTTP ${res.status}`
        try {
            const body = await res.json()
            message = body?.message ?? message
        } catch (err) {
            // ignore parse errors
        }
        throw new Error(message)
    }
    return (await res.json()) as T
}

function authHeaders(token?: string): Record<string, string> {
    return token
        ? {
            Authorization: `Bearer ${token}`,
        }
        : {}
}

export const api = {
    async register(fullName: string, email: string, password: string) {
        const res = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fullName, email, password }),
        })
        return handleResponse<any>(res)
    },

    async login(email: string, password: string) {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email, password}),
        })
        const data = await handleResponse<LoginResult | { type: string; token: string }>(res)
        const token = (data as any).token ?? (data as any)?.token?.token
        if (!token) throw new Error('Missing token from login response')
        return {type: (data as any).type ?? 'bearer', token}
    },
    async logout(token: string) {
        const res = await fetch(`${API_BASE}/logout`, {
            method: 'DELETE',
            headers: {...authHeaders(token)},
        })
        if (!res.ok && res.status !== 401) {
            await handleResponse(res)
        }
    },
    async me(token: string) {
        const res = await fetch(`${API_BASE}/me`, {
            headers: {...authHeaders(token)},
        })
        return handleResponse<any>(res)
    },
    async wallet(token: string) {
        const res = await fetch(`${API_BASE}/me/wallet`, {
            headers: {...authHeaders(token)},
        })
        return handleResponse<number>(res)
    },
    async subjects(token: string) {
        const res = await fetch(`${API_BASE}/me/subjects`, {
            headers: {...authHeaders(token)},
        })
        return handleResponse<any[]>(res)
    },
    async createSubject(token: string, title: string) {
        const res = await fetch(`${API_BASE}/subjects`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', ...authHeaders(token)},
            body: JSON.stringify({title}),
        })
        return handleResponse<any>(res)
    },
    async startTimer(
        token: string,
        payload: { durationSec: number; mode: TimerMode; subjectId?: number }
    ) {
        const res = await fetch(`${API_BASE}/timer/start`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', ...authHeaders(token)},
            body: JSON.stringify(payload),
        })
        return handleResponse<any>(res)
    },
    async stopTimer(token: string, sessionId: number, options: { keepalive?: boolean } = {}) {
        const res = await fetch(`${API_BASE}/timer/stop`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', ...authHeaders(token)},
            body: JSON.stringify({sessionId}),
            keepalive: options.keepalive,
        })
        return handleResponse<any>(res)
    },
    async garden(token: string) {
        const res = await fetch(`${API_BASE}/me/garden`, {
            headers: {...authHeaders(token)},
        })
        return handleResponse<{ grid: any[][] }>(res)
    },
    async plant(token: string, row: number, col: number, seedSlug: string) {
        const res = await fetch(`${API_BASE}/garden/plant`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify({ row, col, seedSlug }),
        })
        return handleResponse<any>(res)
    },
    async harvest(token: string, row: number, col: number) {
        const res = await fetch(`${API_BASE}/garden/harvest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify({ row, col }),
        })
        return handleResponse<any>(res)
    },
    async inventory(token: string) {
        const res = await fetch(`${API_BASE}/me/inventory`, {
            headers: { ...authHeaders(token) },
        })
        return handleResponse<any[]>(res)
    },
    async items(token: string) {
        const res = await fetch(`${API_BASE}/items`, {
            headers: { ...authHeaders(token) },
        })
        return handleResponse<any[]>(res)
    },
    async purchaseItem(token: string, slug: string, quantity = 1) {
        const res = await fetch(`${API_BASE}/items/purchase`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders(token) },
            body: JSON.stringify({ slug, quantity }),
        })
        return handleResponse<any>(res)
    },
    async openPack(token: string, slug: string) {
        const res = await fetch(`${API_BASE}/packs/${slug}/open`, {
            method: 'POST',
            headers: { ...authHeaders(token) },
        })
        return handleResponse<any>(res)
    },
    async leaderboardStudy(range: LeaderboardRange = 'week') {
        const res = await fetch(`${API_BASE}/leaderboard/study?range=${encodeURIComponent(range)}`)
        return handleResponse<StudyLeaderboardResponse>(res)
    },
    async mySessionTotals(token: string) {
        const res = await fetch(`${API_BASE}/me/sessions/totals`, {
            headers: { ...authHeaders(token) },
        })
        return handleResponse<SessionTotals>(res)
    }
}
export default api