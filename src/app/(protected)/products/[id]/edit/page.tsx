'use client';

import ProductFormV2 from '@/components/products/ProductFormV2';
import { useParams } from 'next/navigation';

export default function EditProductPage() {
  const params = useParams();
  const id = params?.id as string;

  if (!id) return null;

  return <ProductFormV2 productId={id} />;
}
