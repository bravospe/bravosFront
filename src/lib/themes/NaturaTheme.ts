import { UnifiedTemplate } from './UnifiedTemplate';

export const NaturaTheme: UnifiedTemplate = {
    id: "natura-theme",
    name: "Natura Organic",
    author: "Studio25",
    version: "1.0.0",
    designSystem: {
        tokens: {
            colors: {
                brand: {
                    primary: "#6A9739", // Organic Leaf Green
                    secondary: "#E8F3D6", // Light Green Surface
                    tertiary: "#2C511F", // Deep Forest Green
                },
                neutral: {
                    bg: "#FFFFFF",
                    surface: "#F9FAF7", // Very subtle cream/green tint
                    border: "#E5E7EB",
                    textPrimary: "#1F2937", // Gray-900 for legacy compatibility
                    textSecondary: "#6B7280",
                    textMuted: "#9CA3AF"
                },
                // ThemeEngine expects 'text' category
                text: {
                    primary: "#1F2937",
                    secondary: "#6B7280",
                    muted: "#9CA3AF",
                    inverse: "#FFFFFF"
                },
                semantic: {
                    success: "#10B981",
                    error: "#EF4444",
                    info: "#3B82F6",
                    warning: "#F59E0B"
                }
            },
            typography: {
                families: {
                    sans: "'Google Sans', sans-serif",
                    heading: "'Google Sans', sans-serif"
                },
                sizes: {
                    xs: "0.75rem",
                    sm: "0.875rem",
                    base: "1rem",
                    lg: "1.125rem",
                    xl: "1.25rem",
                    heading1: "3.5rem",
                    heading2: "2.5rem",
                    heading3: "1.75rem"
                },
                weights: {
                    normal: 400,
                    medium: 500,
                    bold: 700
                },
                lineHeights: {
                    tight: 1.25,
                    normal: 1.5,
                    loose: 1.75
                }
            },
            spacing: {
                scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
                containerMaxWidth: "1440px"
            },
            effects: {
                radius: {
                    small: "4px",
                    medium: "12px",
                    large: "24px",
                    full: "9999px"
                },
                shadow: {
                    card: "0 10px 40px -10px rgba(0,0,0,0.05)",
                    dropdown: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1)"
                },
                blur: {
                    none: "0",
                    sm: "4px",
                    md: "8px",
                    lg: "16px"
                }
            }
        },
        // Components definitions must be INSIDE designSystem for ThemeEngine
        components: {
            button: {
                primary: {
                    backgroundColor: "{brand.primary}",
                    color: "#FFFFFF",
                    borderRadius: "{effects.radius.full}"
                }
            }
        },
        // Layout specific overrides
        layouts: {
            header: {
                height: "90px",
                bg: "#FFFFFF",
                textColor: "#1F2937",
                borderColor: "transparent",
                backdropFilter: "none"
            },
            footer: {
                bg: "#1F2223", // Dark Charcoal/Black for footer
                textColor: "#D1D5DB",
                borderColor: "#374151",
                headingColor: "#FFFFFF"
            }
        }
    },
    pages: {
        home: {
            layout: "full-width",
            blocks: [
                {
                    id: "hero-natura",
                    type: "hero",
                    props: {
                        image: "https://images.unsplash.com/photo-1471193945509-9adadd8d0c60?q=80&w=2070&auto=format&fit=crop",
                        title: "Belleza Natural & Pura",
                        subtitle: "Descubre el poder de los ingredientes botánicos para transformar tu piel.",
                        ctaText: "Explorar Colección",
                        ctaLink: "/catalog"
                    },
                    styleOverrides: {
                        marginTop: "0",
                        borderRadius: "0",
                        minHeight: "650px",
                        textAlign: "left",
                        alignItems: "center"
                    }
                },
                {
                    id: "features-organic",
                    type: "features",
                    props: {
                        title: "Por qué elegir Natura",
                        items: [
                            { title: "100% Orgánico", desc: "Ingredientes certificados sin aditivos sintéticos.", icon: "leaf" },
                            { title: "Cruelty Free", desc: "Nunca probado en animales, respetamos la vida.", icon: "heart" },
                            { title: "Sostenible", desc: "Envases reciclables y procesos eco-amigables.", icon: "recycle" }
                        ]
                    },
                    styleOverrides: {
                        backgroundColor: "var(--color-neutral-surface)"
                    }
                },
                {
                    id: "new-arrivals",
                    type: "product-grid",
                    props: {
                        title: "Nuevos Arribos",
                        limit: 4
                    }
                }
            ]
        }
    }
} as UnifiedTemplate; 
