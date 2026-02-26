import React from 'react';
import { PageBlock } from './UnifiedTemplate';

// === 1. REGISTRO DE COMPONENTES (Block Registry) ===

// Componente: Hero
const HeroBlock = ({ title, subtitle, ctaText, image }: any) => {
    return (
        <div className="relative overflow-hidden rounded-2xl my-8 mx-4 min-h-[500px] flex items-center justify-center text-center">
            {/* Background Image / Overlay */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center"
                style={{
                    backgroundImage: image ? `url(${image})` : undefined,
                    backgroundColor: 'var(--color-neutral-surface)',
                }}
            />
            {/* Overlay: Only visible if image is present to ensure text readability */}
            {image && <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[1px]" />}

            {/* Content */}
            <div className="relative z-20 max-w-4xl px-6">
                <h1
                    className="text-4xl md:text-6xl font-black mb-6 tracking-tight drop-shadow-lg"
                    style={{
                        color: image ? '#FFFFFF' : 'var(--color-text-primary)', // White text if over image, else theme text
                        fontFamily: 'var(--font-heading, var(--font-sans))'
                    }}
                >
                    {title}
                </h1>
                <p
                    className="text-lg md:text-2xl mb-10 max-w-2xl mx-auto leading-relaxed drop-shadow-md"
                    style={{ color: image ? '#F3F4F6' : 'var(--color-text-secondary)' }}
                >
                    {subtitle}
                </p>
                <button
                    className="transition-transform hover:scale-105 active:scale-95"
                    style={{
                        backgroundColor: 'var(--color-brand-primary)',
                        color: 'white', // Default to white usually safe for dark greens/blues. For neons, might need override.
                        padding: '16px 36px',
                        borderRadius: 'var(--radius-full, 999px)',
                        fontWeight: 'bold',
                        fontSize: 'var(--text-lg)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
                        border: 'none'
                    }}
                >
                    {ctaText || "Ver Colección"}
                </button>
            </div>
        </div>
    );
};

// Componente: Features
const FeaturesBlock = ({ title, items }: any) => (
    <div className="py-16 px-4 max-w-[var(--container-max)] mx-auto">
        {title && (
            <h2
                className="text-3xl font-bold text-center mb-12"
                style={{ color: 'var(--color-text-primary)' }}
            >
                {title}
            </h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {items?.map((item: any, i: number) => (
                <div
                    key={i}
                    className="p-8 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg"
                    style={{
                        backgroundColor: 'var(--color-neutral-bg)',
                        borderColor: 'var(--color-neutral-border)',
                        boxShadow: 'var(--shadow-card, none)'
                    }}
                >
                    <div
                        className="w-12 h-12 mb-6 rounded-full flex items-center justify-center"
                        style={{
                            backgroundColor: 'var(--color-brand-secondary, rgba(0,0,0,0.05))',
                            color: 'var(--color-brand-primary)'
                        }}
                    >
                        {/* Simple Icon Placeholder */}
                        <span className="text-2xl">
                            {item.icon === 'leaf' ? '🌿' : item.icon === 'heart' ? '💚' : '★'}
                        </span>
                    </div>
                    <h3
                        className="text-xl font-bold mb-3"
                        style={{ color: 'var(--color-text-primary)' }}
                    >
                        {item.title}
                    </h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        {item.desc}
                    </p>
                </div>
            ))}
        </div>
    </div>
);

// Componente: Product Grid
const ProductGridBlock = ({ title, products, limit = 4 }: any) => {
    // Determine what to render: real products or placeholders
    const itemsToRender = products && products.length > 0
        ? products
        : Array.from({ length: limit }).map((_, i) => ({
            id: i,
            name: `Organic Serum ${i + 1}`,
            price: 120, // Example price
            isPlaceholder: true
        }));

    return (
        <div className="py-16 px-4 max-w-[var(--container-max)] mx-auto">
            {title && (
                <div className="flex items-center justify-between mb-10">
                    <h2
                        className="text-3xl font-bold"
                        style={{
                            color: 'var(--color-text-primary)',
                            fontFamily: 'var(--font-heading, inherit)'
                        }}
                    >
                        {title}
                    </h2>
                    <a href="/catalog" className="font-semibold hover:underline" style={{ color: 'var(--color-brand-primary)' }}>Ver Todo →</a>
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {itemsToRender.slice(0, limit || 4).map((product: any, i: number) => {
                    // Robust image resolving logic
                    let imageUrl = null;
                    if (product.image) imageUrl = product.image;
                    else if (product.images && product.images.length > 0) {
                        imageUrl = typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url;
                    }

                    return (
                        <div
                            key={product.id || i}
                            className="group rounded-xl overflow-hidden transition-all hover:shadow-xl"
                            style={{
                                backgroundColor: 'var(--color-neutral-surface)',
                                boxShadow: 'var(--shadow-card, none)'
                            }}
                        >
                            <div className="aspect-[3/4] bg-gray-100 relative overflow-hidden group-hover:opacity-95">
                                {/* Image */}
                                {imageUrl ? (
                                    <img
                                        src={imageUrl}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement?.classList.add('image-error-fallback');
                                        }}
                                    />
                                ) : (
                                    <div className="absolute inset-0 bg-gray-200 flex items-center justify-center">
                                        <span className="text-4xl opacity-20">🍃</span>
                                    </div>
                                )}

                                {/* Fallback visible only if image fails or missing */}
                                <div className="absolute inset-0 bg-gray-200 flex items-center justify-center hidden image-error-fallback">
                                    <span className="text-4xl opacity-20">🍃</span>
                                </div>

                                {/* Quick Add Button (visible on hover) */}
                                <button
                                    className="absolute bottom-4 left-4 right-4 py-3 rounded-full font-bold opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
                                    style={{
                                        backgroundColor: 'rgba(255,255,255,0.95)',
                                        color: 'black',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    + Ver Detalle
                                </button>
                            </div>
                            <div className="p-5 text-center">
                                <h3 className="font-medium mb-1 truncate text-lg" style={{ color: 'var(--color-text-primary)' }}>
                                    {product.name}
                                </h3>
                                <p className="font-bold" style={{ color: 'var(--color-text-primary)' }}>
                                    {/* Force PEN format */}
                                    {new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(Number(product.price) || 0)}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Componente Demo: Fallback
const UnknownBlock = ({ type }: { type: string }) => (
    <div className="p-10 border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 rounded-xl text-center m-4">
        Block Type Not Found: <code>{type}</code>
    </div>
);

// Mapeo ID -> Componente Real
const COMPONENT_REGISTRY: Record<string, React.ComponentType<any>> = {
    'hero': HeroBlock,
    'product-grid': ProductGridBlock,
    'features': FeaturesBlock,
};

// === 2. EL RENDERIZADOR ===

interface BlockRendererProps {
    block: PageBlock;
}

export const BlockRenderer = ({ block }: BlockRendererProps) => {
    const Component = COMPONENT_REGISTRY[block.type] || UnknownBlock;
    const style = block.styleOverrides || {};

    return (
        <section
            id={block.id}
            className={`theme-block block-${block.type}`}
            style={style}
        >
            {block.type === 'unknown' ? (
                <Component type={block.type} />
            ) : (
                <Component {...block.props} />
            )}
        </section>
    );
};
