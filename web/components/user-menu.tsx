'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { ChevronDown, LogOut, User as UserIcon, CalendarDays } from 'lucide-react'

export default function UserMenu() {
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

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-200/70 rounded-md transition-colors"
            >
                <div className="size-8 rounded-full bg-gray-300 text-gray-700 flex items-center justify-center text-sm font-medium">
                    {displayName?.charAt(0)?.toUpperCase()}
                </div>
                <span className="hidden sm:block max-w-[18ch] truncate text-sm">{displayName}</span>
                <ChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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


