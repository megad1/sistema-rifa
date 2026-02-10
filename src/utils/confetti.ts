// src/utils/confetti.ts
// Utilitário de confetti reutilizável para celebrações

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Dispara confetti celebratório dos dois lados da tela.
 * Requer que o script canvas-confetti esteja carregado na página.
 */
export function fireConfettiBurst() {
    try {
        const confetti = (window as any).confetti;
        if (typeof confetti !== 'function') return;

        const y = 0.55;
        const leftX = 0.1;
        const rightX = 0.9;

        const dualBurst = (
            particleCount: number,
            spread: number,
            startVelocity: number,
            scalar = 1
        ) => {
            confetti({
                particleCount, spread, startVelocity, scalar,
                origin: { x: leftX, y }, angle: 60, ticks: 200,
                colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#7B68EE', '#32CD32'],
                zIndex: 2147483647,
            });
            confetti({
                particleCount, spread, startVelocity, scalar,
                origin: { x: rightX, y }, angle: 120, ticks: 200,
                colors: ['#FFD700', '#FFA500', '#FF6347', '#00CED1', '#7B68EE', '#32CD32'],
                zIndex: 2147483647,
            });
        };

        // 3 ondas de confetti
        dualBurst(100, 70, 40, 1.0);
        setTimeout(() => dualBurst(140, 100, 45, 0.95), 180);
        setTimeout(() => dualBurst(100, 60, 36, 1.05), 380);
    } catch {
        // silently fail
    }
}

/**
 * Carrega o script canvas-confetti dinamicamente se ainda não existir.
 * Retorna uma Promise que resolve quando o script está pronto.
 */
export function loadConfettiScript(): Promise<void> {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && (window as any).confetti) {
            resolve();
            return;
        }
        const existing = document.querySelector('script[src*="canvas-confetti"]');
        if (existing) {
            if ((window as any).confetti) { resolve(); return; }
            existing.addEventListener('load', () => resolve());
            setTimeout(resolve, 2000);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => resolve();
        document.head.appendChild(script);
    });
}
