export type Subject = { id: number; title: string }
export type UserProfile = { id: number; fullName?: string; email: string }

export type LeaderboardRange = 'day' | 'week' | 'month' | 'year'

export type StudyLeaderboardEntry = {
    rank: number
    userId: number
    fullName?: string | null
    email: string
    totalSeconds: number
    totalMinutes: number
    sessionsCount: number
}

export type StudyLeaderboardResponse = {
    range: LeaderboardRange
    from: string
    to: string
    entries: StudyLeaderboardEntry[]
}

export type SessionTotals = {
    totalSeconds: number
    totalMinutes: number
    sessionsCount: number
}