'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { ChevronDown, LogOut, User as UserIcon, CalendarDays } from 'lucide-react'

type UserMenuProps = { variant?: 'default' | 'dark' }

export default function UserMenu({ variant = 'default' }: UserMenuProps) {
    const { user, logout } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (!containerRef.current) return
            if (!containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', onClickOutside)
        }
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [isOpen])

    if (!user) return null

    const displayName = user.full_name ?? user.email

    const isDark = variant === 'dark'

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                    isDark ? 'hover:bg-white/10 text-white' : 'hover:bg-gray-200/70'
                }`}
            >
                <div className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    isDark ? 'bg-emerald-700/80 text-white' : 'bg-gray-300 text-gray-700'
                }`}>
                    {displayName?.charAt(0)?.toUpperCase()}
                </div>
                <span className={`hidden sm:block max-w-[18ch] truncate text-sm ${isDark ? 'text-white' : ''}`}>{displayName}</span>
                <ChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-white' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 pb-2 pt-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                    </div>

                    <div className="py-1">
                        <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <UserIcon className="size-4" />
                            My Profile
                        </Link>
                        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                            <CalendarDays className="size-4" />
                            Dashboard
                        </Link>
                    </div>

                    <button
                        onClick={() => { logout(); setIsOpen(false) }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                        <LogOut className="size-4" />
                        Sign out
                    </button>
                </div>
            )}

            {isOpen && <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />}
        </div>
    )
}


