import { UnifiedTemplate } from './UnifiedTemplate';

export const DarkVibrantTheme: UnifiedTemplate = {
    id: "dark-vibrant-v1",
    name: "Neon Nights",
    version: "1.0.0",
    author: "Studio25",
    description: "A premium dark theme with vibrant neon accents, perfect for high-impact brands.",

    designSystem: {
        $schema: "1.0.0",
        id: "dark-vibrant",
        name: "Neon Nights System",
        author: "Studio25",
        tokens: {
            colors: {
                brand: {
                    primary: "#CCFF00",    // Neon Lime
                    secondary: "#7000FF",  // Electric Purple
                    accent: "#00FFFF"      // Cyan
                },
                neutral: {
                    bg: "#050505",       // Almost Black
                    surface: "#121212",  // Dark Grey
                    border: "#2A2A2A",
                    text: "#FFFFFF"
                },
                text: {
                    primary: "#FFFFFF",
                    secondary: "#A1A1AA",
                    muted: "#52525B",
                    inverse: "#000000"
                },
                semantic: {
                    success: "#00FF9D",
                    warning: "#FFB800",
                    error: "#FF0055",
                    info: "#00E5FF"
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
                    '2xl': "1.5rem",
                    '3xl': "2rem",
                    '4xl': "2.5rem",
                    '5xl': "3.5rem"
                },
                weights: {
                    normal: 400,
                    medium: 500,
                    bold: 700,
                    black: 900
                },
                lineHeights: {
                    tight: 1.1,
                    normal: 1.5,
                    relaxed: 1.7
                }
            },
            spacing: {
                scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 96, 128],
                containerMaxWidth: "1400px"
            },
            effects: {
                radius: {
                    none: "0",
                    sm: "4px",
                    md: "12px",
                    lg: "24px",
                    full: "9999px"
                },
                shadow: {
                    sm: "0 4px 6px -1px rgba(0, 0, 0, 0.5)",
                    md: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
                    lg: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
                    glow: "0 0 20px rgba(204, 255, 0, 0.3)"
                },
                blur: {
                    none: "0",
                    sm: "4px",
                    md: "12px",
                    lg: "24px"
                }
            }
        },
        components: {
            button: {
                primary: {
                    bg: "brand.primary",
                    color: "black",
                    radius: "effects.radius.full",
                    padding: "16px 32px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    shadow: "effects.shadow.glow"
                }
            },
            card: {
                default: {
                    bg: "neutral.surface",
                    border: "1px solid {neutral.border}",
                    radius: "effects.radius.md",
                    padding: "spacing.6"
                }
            }
        },
        layouts: {
            header: {
                height: "80px",
                bg: "rgba(5, 5, 5, 0.8)",
                textColor: "#FFFFFF",
                borderColor: "{neutral.border}",
                backdropFilter: "blur(12px)"
            },
            footer: {
                bg: "#000000",
                textColor: "#A1A1AA",
                borderColor: "{neutral.border}",
                headingColor: "#FFFFFF"
            }
        }
    },

    layouts: {
        main: {
            id: "main-layout",
            type: "flex",
            flex: { direction: "column", align: "stretch", justify: "flex-start", wrap: false },
            styles: {
                background: "neutral.bg",
                color: "text.primary",
                minHeight: "100vh"
            }
        }
    },

    pages: {
        home: {
            id: "home",
            path: "/",
            layoutId: "main",
            meta: { title: "Home | Neon Nights", description: "Experience the future of shopping." },
            blocks: [
                {
                    id: "hero-section",
                    type: "hero",
                    order: 0,
                    visible: true,
                    props: {
                        title: "FUTURE READY",
                        subtitle: "Distinguish yourself with a design that speaks volume. Bold, dark, and unapologetically modern.",
                        ctaText: "EXPLORE COLLECTION",
                        image: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?q=80&w=2574&auto=format&fit=crop"
                    },
                    styleOverrides: {
                        paddingTop: "120px",
                        paddingBottom: "120px"
                    }
                },
                {
                    id: "features-grid",
                    type: "features",
                    order: 1,
                    visible: true,
                    props: {
                        title: "WHY CHOOSE US",
                        items: [
                            { title: "Premium Quality", desc: "Curated materials for the best feel." },
                            { title: "Fast Shipping", desc: "Global delivery within 72 hours." },
                            { title: "Secure Payment", desc: "Encrypted transactions for peace of mind." }
                        ]
                    }
                },
                {
                    id: "product-showcase",
                    type: "product-grid",
                    order: 2,
                    visible: true,
                    props: {
                        title: "TRENDING NOW",
                        limit: 4
                    }
                }
            ]
        }
    }
};
