'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function EditProductPage() {
    const router = useRouter()
    const { id } = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [product, setProduct] = useState<any>(null)

    useEffect(() => {
        if (id) {
            fetch(`/api/admin/products.php?id=${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.id) {
                        setProduct(data)
                    } else {
                        setError('Product not found')
                    }
                    setLoading(false)
                })
                .catch(err => {
                    setError('Failed to load product')
                    setLoading(false)
                })
        }
    }, [id])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        const formData = new FormData(e.currentTarget)
        formData.append('_method', 'PUT')
        formData.append('id', id as string)

        try {
            const res = await fetch('/api/admin/products.php', {
                method: 'POST', // Use POST to support file upload, PHP script handles _method=PUT
                body: formData,
            })

            const json = await res.json()
            if (!res.ok) throw new Error(json.error || 'Failed to update product')

            router.push('/admin/products')
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!product && !loading) return <div className="p-8 text-center text-red-500">Product not found</div>

    return (
        <div className="flex flex-col gap-6 max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="name">Product Name</Label>
                            <Input id="name" name="name" defaultValue={product.name} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input id="category" name="category" defaultValue={product.category} />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="price">Price (฿)</Label>
                            <Input id="price" name="price" type="number" step="0.01" defaultValue={product.price} required />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <textarea
                                id="description"
                                name="description"
                                defaultValue={product.description}
                                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="image">Image Update (Optional)</Label>
                            <Input id="image" name="image" type="file" accept="image/*" />
                            {product.image_url && (
                                <div className="mt-2">
                                    <p className="text-xs text-muted-foreground mb-1">Current Image:</p>
                                    <img src={product.image_url} alt="Current" className="h-20 w-20 object-cover rounded-md border" />
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
