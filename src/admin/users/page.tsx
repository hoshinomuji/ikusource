'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash, Shield, ShieldCheck } from 'lucide-react'

type User = {
    id: number
    first_name: string
    last_name: string
    email: string
    role: string
    credit: number
    created_at: string
}

export default function UsersAdminPage() {
    const [users, setUsers] = useState<User[]>([])

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = () => {
        fetch('/api/admin/users.php')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setUsers(data)
            })
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return

        const res = await fetch(`/api/admin/users.php?id=${id}`, {
            method: 'DELETE'
        })
        if (res.ok) {
            setUsers(users.filter(u => u.id !== id))
        }
    }

    const toggleRole = async (user: User) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin'
        if (!confirm(`Change role to ${newRole}?`)) return

        const res = await fetch('/api/admin/users.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: user.id, role: newRole })
        })

        if (res.ok) {
            loadUsers()
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Credit</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.id}</TableCell>
                                <TableCell>{user.first_name} {user.last_name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {user.role === 'admin' ? <ShieldCheck className="h-4 w-4 text-primary" /> : <Shield className="h-4 w-4 text-muted-foreground" />}
                                        <span className="capitalize">{user.role}</span>
                                    </div>
                                </TableCell>
                                <TableCell>฿{user.credit}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="ghost" size="sm" onClick={() => toggleRole(user)}>
                                        {user.role === 'admin' ? 'Demote' : 'Promote'}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(user.id)}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
