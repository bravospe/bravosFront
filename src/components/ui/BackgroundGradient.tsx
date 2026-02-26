'use client';

export const BackgroundGradient = () => {
    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none hidden dark:block select-none">
            {/* Base Background */}
            <div className="absolute inset-0 bg-[#0D1117]" />

            {/* Animated Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
                {/* Orb 1: Emerald/Green */}
                <div
                    className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-emerald-500/10 blur-[100px] mix-blend-screen animate-blob"
                />

                {/* Orb 2: Violet/Purple */}
                <div
                    className="absolute top-[10%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-violet-600/10 blur-[100px] mix-blend-screen animate-blob animation-delay-2000"
                />

                {/* Orb 3: Blue/Teal (Bottom) */}
                <div
                    className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-500/10 blur-[120px] mix-blend-screen animate-blob animation-delay-4000"
                />
            </div>

            {/* Grain Texture for detailed feel */}
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </div>
    );
};
