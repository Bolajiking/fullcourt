'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';

interface ProductCreateFormProps {
  onSuccess?: (productId: string) => void;
}

export function ProductCreateForm({ onSuccess }: ProductCreateFormProps) {
  const { userId } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '0',
    images: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);

  async function createProduct() {
    if (!formData.name.trim()) {
      alert('Please enter a product name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'x-user-id': userId } : {}),
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          price: parseFloat(formData.price) || 0,
          images: formData.images.split('\n').filter(Boolean),
          isActive: formData.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create product');
      }

      const result = await response.json();
      setFormData({
        name: '',
        description: '',
        price: '0',
        images: '',
        isActive: true,
      });
      onSuccess?.(result.product.id);
      alert('Product created!');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create product');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="product-name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="product-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
          placeholder="Product name"
          required
        />
      </div>

      <div>
        <label htmlFor="product-description" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Description
        </label>
        <textarea
          id="product-description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={4}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
          placeholder="Describe the item"
        />
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <label htmlFor="product-price" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Price (USD)
          </label>
          <input
            type="number"
            id="product-price"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
            placeholder="0.00"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="product-active"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 text-black focus:ring-black dark:border-zinc-700 dark:focus:ring-white"
          />
          <label htmlFor="product-active" className="ml-2 text-sm text-zinc-700 dark:text-zinc-300">
            Active
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="product-images" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Image URLs (one per line)
        </label>
        <textarea
          id="product-images"
          value={formData.images}
          onChange={(e) => setFormData({ ...formData, images: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-black shadow-sm focus:border-black focus:outline-none focus:ring-black dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-white dark:focus:ring-white"
          placeholder="https://example.com/image.jpg"
        />
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          Optional. Add one image URL per line.
        </p>
      </div>

      <button
        onClick={createProduct}
        disabled={loading}
        className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {loading ? 'Creating...' : 'Add Product'}
      </button>
    </div>
  );
}

