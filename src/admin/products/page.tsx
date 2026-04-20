'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash, Edit } from 'lucide-react'

type Product = {
    id: number
    name: string
    price: number
    category: string
    image_url: string
    updated_at: string
}

export default function ProductsAdminPage() {
    const [products, setProducts] = useState<Product[]>([])

    useEffect(() => {
        fetch('/api/admin/products.php')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setProducts(data)
            })
    }, [])

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return

        const res = await fetch(`/api/admin/products.php?id=${id}`, {
            method: 'DELETE'
        })
        if (res.ok) {
            setProducts(products.filter(p => p.id !== id))
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                <Link href="/admin/products/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </Link>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Image</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell>
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="h-10 w-10 rounded-md object-cover"
                                        />
                                    ) : (
                                        <div className="h-10 w-10 bg-muted rounded-md" />
                                    )}
                                </TableCell>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell>{product.category}</TableCell>
                                <TableCell>฿{product.price}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Link href={`/admin/products/${product.id}`}>
                                        <Button variant="ghost" size="icon">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(product.id)}
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {products.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No products found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
