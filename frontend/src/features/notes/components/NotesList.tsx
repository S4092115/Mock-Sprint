'use client'

import { useMemo } from 'react'
import { where } from 'firebase/firestore'
import { useCollection } from '@/hooks/useFirestore'
import { useAuth } from '@/hooks/useAuth'
import { getNotesCollection } from '@/lib/firebase/firestore'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { EmptyState } from '@/components/shared/EmptyState'

export function NotesList() {
    const { user } = useAuth()
    const notesCollection = useMemo(() => getNotesCollection(), [])
    const constraints = useMemo(
        () => (user ? [where('uid', '==', user.uid)] : []),
        [user?.uid]
    )

    const { data: notes, loading } = useCollection(notesCollection, ...constraints)

    if (!user || loading) return <LoadingSpinner />
    if (notes.length === 0) return <EmptyState title="No notes yet" />

    return (
        <ul className="space-y-2">
            {notes.map((note) => (
                <li key={note.id} className="rounded-lg border p-4">
                    <h3 className="font-medium">{note.title}</h3>
                    <p className="text-sm text-zinc-500">{note.body}</p>
                </li>
            ))}
        </ul>
    )
}