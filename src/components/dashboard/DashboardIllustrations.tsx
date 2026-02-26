import { FC, SVGProps } from 'react';

// Illustration for New Product (Green theme)
export const IllustrationNewProduct: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M50 250H450" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <rect x="100" y="100" width="120" height="150" rx="10" fill="#D1FAE5" />
        <rect x="110" y="110" width="100" height="80" rx="5" fill="#34D399" fillOpacity="0.2" />
        <rect x="110" y="200" width="80" height="10" rx="5" fill="#10B981" />
        <rect x="110" y="220" width="60" height="10" rx="5" fill="#10B981" fillOpacity="0.5" />

        <rect x="250" y="120" width="140" height="130" rx="10" fill="#10B981" fillOpacity="0.1" />
        <circle cx="320" cy="185" r="40" stroke="#10B981" strokeWidth="4" strokeDasharray="10 10" />
        <path d="M320 165V205M300 185H340" stroke="#10B981" strokeWidth="4" strokeLinecap="round" />

        <circle cx="420" cy="280" r="15" fill="#34D399" />
        <circle cx="80" cy="80" r="20" fill="#34D399" fillOpacity="0.2" />
    </svg>
);

// Illustration for POS Sale (Purple theme)
export const IllustrationPOS: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M50 280H450" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />

        {/* POS Screen */}
        <rect x="120" y="80" width="180" height="140" rx="10" fill="#EDE9FE" stroke="#8B5CF6" strokeWidth="2" />
        <rect x="130" y="90" width="160" height="100" rx="5" fill="#DDD6FE" />
        <rect x="190" y="220" width="40" height="60" fill="#8B5CF6" />
        <path d="M160 280H260" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />

        {/* Product Items */}
        <rect x="140" y="100" width="30" height="30" rx="4" fill="#8B5CF6" fillOpacity="0.6" />
        <rect x="180" y="100" width="30" height="30" rx="4" fill="#8B5CF6" fillOpacity="0.4" />
        <rect x="220" y="100" width="30" height="30" rx="4" fill="#8B5CF6" fillOpacity="0.4" />

        {/* Hand/Person Element Abstract */}
        <circle cx="360" cy="180" r="50" fill="#8B5CF6" fillOpacity="0.1" />
        <path d="M360 150L380 200H340L360 150Z" fill="#8B5CF6" />
    </svg>
);

// Illustration for Analytics (Green theme)
export const IllustrationStats: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M50 280H450" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

        {/* Chart */}
        <rect x="100" y="180" width="40" height="100" rx="4" fill="#34D399" fillOpacity="0.4" />
        <rect x="160" y="140" width="40" height="140" rx="4" fill="#34D399" fillOpacity="0.6" />
        <rect x="220" y="100" width="40" height="180" rx="4" fill="#10B981" />
        <rect x="280" y="160" width="40" height="120" rx="4" fill="#34D399" fillOpacity="0.5" />

        {/* Trend Line */}
        <path d="M100 160L160 120L220 80L280 140L340 100" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="340" cy="100" r="6" fill="#059669" />

        {/* Floating Data */}
        <rect x="350" y="60" width="80" height="40" rx="8" fill="#D1FAE5" />
        <rect x="360" y="75" width="60" height="10" rx="5" fill="#10B981" />
    </svg>
);

// Illustration for Reminders (Purple Action)
export const IllustrationReminders: FC<SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 500 350" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <circle cx="250" cy="175" r="100" fill="#EDE9FE" />
        <path d="M250 100V130" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
        <path d="M250 130C220 130 200 150 200 180V220H300V180C300 150 280 130 250 130Z" fill="#C4B5FD" stroke="#8B5CF6" strokeWidth="2" />
        <path d="M230 220V230C230 240 240 250 250 250C260 250 270 240 270 230V220" fill="#8B5CF6" />

        {/* Notification bubble */}
        <circle cx="320" cy="120" r="20" fill="#EF4444" />
        <path d="M315 120H325M320 115V125" stroke="white" strokeWidth="2" />
    </svg>
);
