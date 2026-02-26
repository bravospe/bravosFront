'use client';

import ProductForm from '@/components/products/ProductForm';
import { useParams } from 'next/navigation';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;

  if (!id) return null;

  return <ProductForm productId={id} />;
}
