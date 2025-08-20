'use client';

import { useEffect, useRef, useState } from 'react';

type WinwheelSegment = { text?: string };

interface WinwheelAnimation {
  type?: string;
  duration?: number;
  spins?: number;
  callbackFinished?: () => void;
  stopAngle?: number | null;
}

interface WinwheelInstance {
  outerRadius: number;
  stopAnimation: (canComplete?: boolean) => void;
  rotationAngle: number;
  draw: () => void;
  startAnimation: () => void;
  getIndicatedSegment?: () => WinwheelSegment | null;
  wheelImage?: HTMLImageElement | HTMLCanvasElement;
  animation?: WinwheelAnimation;
}

type WinwheelCtor = new (config: Record<string, unknown>) => WinwheelInstance;

interface TweenMaxLike {
  killTweensOf?: (obj: unknown) => void;
  killDelayedCallsTo?: (obj: unknown) => void;
  killAll?: (a?: boolean, b?: boolean, c?: boolean) => void;
}

declare global {
  interface Window {
    Winwheel?: WinwheelCtor;
    TweenMax?: TweenMaxLike;
  }
}

interface WinwheelRouletteProps {
  imageSrc: string;
  wheelSizePx?: number;
  angleOffsetDeg?: number; // ajuste fino para alinhar com o ponteiro no topo
  segments?: string[]; // rótulos lógicos (não desenhados) para mapear o resultado
  spins?: number;
  durationSec?: number;
  paddingPx?: number; // margem interna para evitar corte nas bordas (se não informado, calcula 6% do tamanho)
  imageScale?: number; // escala visual do canvas (CSS) – opcional
  imageFitScale?: number; // escala da imagem dentro do canvas (offscreen), cria folga real (1 = ocupar 100%)
  disabled?: boolean;
  playerCpf?: string; // CPF opcional; se ausente usa sessão via cookie
  onSpinStart?: () => boolean | void;
  onFinished?: (resultLabel: string) => void;
  centerOverlaySrc?: string; // imagem central (seta) apontando para a direita
  centerOverlaySizePx?: number; // tamanho do overlay central (px)
}

export default function WinwheelRoulette({
  imageSrc,
  wheelSizePx = 360,
  angleOffsetDeg = 0,
  segments: segmentLabels = [
    // Mapa final (0°=direita):
    // 8 MIL (330°–30°) → TENTE (30°–90°) → 15 MIL (90°–150°) → CARRO (150°–210°)
    // → TENTE (210°–270°) → 2 iPhones (270°–330°)
    '8 MIL REAIS',
    'TENTE OUTRA VEZ', // direita
    '15 MIL REAIS',
    'CARRO 0KM',
    'TENTE OUTRA VEZ', // esquerda
    '2 iPhone 16 Pro Max',
  ],
  spins = 7,
  durationSec = 5,
  paddingPx,
  imageScale = 1,
  imageFitScale = 0.995,
  disabled = false,
  playerCpf,
  onSpinStart,
  onFinished,
  centerOverlaySrc = '/gire.png',
  centerOverlaySizePx = 110,
}: WinwheelRouletteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelInstanceRef = useRef<WinwheelInstance | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);

  // Guardar callbacks mais recentes sem re-inicializar o wheel
  const onFinishedRef = useRef<typeof onFinished>(onFinished);
  const onSpinStartRef = useRef<typeof onSpinStart>(onSpinStart);
  useEffect(() => { onFinishedRef.current = onFinished; }, [onFinished]);
  useEffect(() => { onSpinStartRef.current = onSpinStart; }, [onSpinStart]);
  const segmentsRef = useRef<Array<{ text: string; size?: number }>>([]);
  const wheelImageRef = useRef<HTMLCanvasElement | HTMLImageElement | null>(null);
  const baseStartDegRef = useRef<number>(330); // primeiro segmento inicia em 330°
  const sizesDegRef = useRef<number[]>([]);
  const selectedIdxRef = useRef<number | null>(null);

  useEffect(() => {
    let checkInterval: number | null = null;

    function initIfReady() {
      if (!canvasRef.current) return;
      if (typeof window === 'undefined') return;
      if (!window.Winwheel) return;
      if (typeof window.TweenMax === 'undefined') return; // GSAP v2 necessário
      if (wheelInstanceRef.current) return; // já inicializado

      // Todos com 60° (cada faixa é de 60°)
      const sizesDeg = [60, 60, 60, 60, 60, 60];
      const segments = segmentLabels.map((label, idx) => ({ text: label, size: sizesDeg[idx] ?? (360 / segmentLabels.length) }));
      segmentsRef.current = segments;
      sizesDegRef.current = sizesDeg;

      const computedPct = Math.ceil(wheelSizePx * 0.015);
      const effectivePadding = paddingPx ?? Math.max(0, computedPct);

      // Primeiro segmento deve iniciar em 330° para cobrir 330°–30°
      baseStartDegRef.current = 330;
      // ponteiro lógico no topo (90°), então giramos -90° para manter o início em 330° relativo ao ponteiro
      const effectiveRotation = (baseStartDegRef.current - 90) + angleOffsetDeg; // 240° + offset
      const theWheel = new window.Winwheel({
        canvasId: canvasRef.current.id,
        numSegments: segments.length,
        outerRadius: Math.max(10, Math.floor(wheelSizePx / 2) - Math.max(1, effectivePadding)),
        // Ponteiro lógico no topo (90°)
        pointerAngle: 90,
        rotationAngle: effectiveRotation,
        drawMode: 'image',
        textFontSize: 0, // não desenhar texto; imagem já contém
        segments,
        animation: {
          type: 'spinToStop',
          duration: durationSec,
          spins,
          callbackFinished: onFinishedLocal,
        },
        pins: {
          number: 0,
        },
      });

      function onFinishedLocal() {
        try {
          const seg = theWheel.getIndicatedSegment?.() ?? null;
          if (seg && seg.text) {
            setMessage(seg.text);
            if (typeof onFinishedRef.current === 'function') onFinishedRef.current(seg.text);
          }
        } catch {
          // no-op
        } finally {
          setIsSpinning(false);
        }
      }

      // Carrega a imagem e associa ao wheel
      const img = new Image();
      img.src = imageSrc;
      img.onload = () => {
        try {
          // Desenha em um canvas offscreen reduzindo um pouco o tamanho da imagem
          // para garantir bordas transparentes e evitar qualquer corte.
          const diameter = theWheel.outerRadius * 2;
          const off = document.createElement('canvas');
          off.width = diameter;
          off.height = diameter;
          const ctx = off.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, diameter, diameter);
            // Permite scale > 1 para "cortar" levemente a imagem e eliminar áreas vazias
            const scale = Math.max(0.5, imageFitScale);
            const drawW = img.width * (diameter / Math.max(img.width, img.height)) * scale;
            const drawH = img.height * (diameter / Math.max(img.width, img.height)) * scale;
            const dx = (diameter - drawW) / 2;
            const dy = (diameter - drawH) / 2;
            ctx.drawImage(img, dx, dy, drawW, drawH);
          }
          theWheel.wheelImage = off;
          wheelImageRef.current = off;
          theWheel.draw();
          setImageLoaded(true);
          setReady(true);
        } catch {
          // no-op
        }
      };

      wheelInstanceRef.current = theWheel;
    }

    // tentativa imediata
    initIfReady();
    // fallback: aguarda scripts carregarem
    if (!wheelInstanceRef.current) {
      checkInterval = window.setInterval(initIfReady, 200);
    }

    return () => {
      if (checkInterval) window.clearInterval(checkInterval);
      wheelInstanceRef.current = null;
      setReady(false);
    };
  }, []); // inicializar apenas uma vez (evita reiniciar a roleta durante o ciclo)

  function fireConfettiIfWin(label: string) {
    try {
      // @ts-ignore confetti global fornecido via script em /roleta/page.tsx
      const confetti = (window as any).confetti as undefined | ((opts: any) => void);
      if (!confetti) return;
      if (/TENTE/i.test(label)) return; // Não dispara para "TENTE OUTRA VEZ"
      const burst = (particleCount: number, spread: number, startVelocity: number, scalar = 1) => {
        confetti({ particleCount, spread, startVelocity, origin: { y: 0.3 }, ticks: 200, scalar });
      };
      burst(80, 70, 35, 1.0);
      setTimeout(() => burst(120, 100, 45, 0.9), 180);
      setTimeout(() => burst(80, 60, 30, 1.1), 360);
    } catch {}
  }

  const handleSpin = async () => {
    if (!wheelInstanceRef.current || isSpinning || !ready || !imageLoaded || disabled) return;
    const allow = onSpinStartRef.current ? onSpinStartRef.current() : true;
    if (allow === false) return;
    setMessage('');
    setIsSpinning(true);

    // Reset opcional para permitir giros múltiplos
    const prev = wheelInstanceRef.current;
    try {
      prev.stopAnimation(false);
      // Mata qualquer tween residual do GSAP na instância anterior
      try {
        const tm = window.TweenMax;
        tm?.killTweensOf?.(prev);
        tm?.killDelayedCallsTo?.(prev);
        tm?.killAll?.(false, true, true);
      } catch {}

      const currentAngle = ((prev.rotationAngle % 360) + 360) % 360;

      const WinwheelClass = window.Winwheel;
      if (!WinwheelClass) { setIsSpinning(false); return; }

      // 1) Inicia giro imediatamente (pré-rotação) enquanto busca o resultado no servidor
      const preWheel = new WinwheelClass({
        canvasId: canvasRef.current!.id,
        numSegments: segmentsRef.current.length,
        outerRadius: prev.outerRadius,
        pointerAngle: 90,
        rotationAngle: currentAngle,
        drawMode: 'image',
        textFontSize: 0,
        segments: segmentsRef.current,
        animation: {
          type: 'spinToStop',
          duration: Math.max(6, durationSec + 2),
          spins: Math.max(12, Math.floor(spins) + 6),
          // Não finaliza aqui; vamos reconfigurar antes de terminar
          callbackFinished: () => {},
        },
        pins: { number: 0 },
      });
      if (wheelImageRef.current) preWheel.wheelImage = wheelImageRef.current;
      preWheel.draw();
      wheelInstanceRef.current = preWheel;
      preWheel.startAnimation();

      // 2) Busca o alvo no servidor em paralelo
      const outcomePromise = (async () => {
        const hasCpf = !!(playerCpf && playerCpf.replace(/\D/g, '').length >= 11);
        const resp = await fetch('/api/roulette/spin', hasCpf ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cpf: playerCpf!.replace(/\D/g, '') }) } : { method: 'POST' });
        if (!resp.ok) throw new Error('spin_http_error');
        const data: { success?: boolean; stopAngle?: number; idx?: number; label?: string } = await resp.json();
        if (!data || !data.success) throw new Error('spin_invalid_response');
        return data;
      })();

      let data: { success?: boolean; stopAngle?: number; idx?: number; label?: string };
      try {
        data = await outcomePromise;
      } catch (e) {
        // Falha de backend: interrompe pré-rotação e aborta
        preWheel.stopAnimation(false);
        setIsSpinning(false);
        return;
      }

      // 3) Com o alvo em mãos, para a pré-rotação e cria a rotação final para o ângulo certo
      const sizes = sizesDegRef.current;
      const base = baseStartDegRef.current;
      let idx: number | null = (typeof data.idx === 'number' && data.idx >= 0 && data.idx < sizes.length) ? data.idx : null;
      if (idx === null && data.label) {
        const found = segmentsRef.current.findIndex(s => (s.text || '').toLowerCase() === data.label!.toLowerCase());
        if (found >= 0) idx = found;
      }

      let targetAngle: number | null = null;
      if (idx !== null) {
        let start = base;
        for (let i = 0; i < idx; i += 1) start = (start + sizes[i]) % 360;
        const size = sizes[idx];
        const margin = Math.min(size / 2 - 1, Math.max(5, size * 0.15));
        const angleWithin = margin + Math.random() * (size - 2 * margin);
        targetAngle = (start + angleWithin) % 360;
        selectedIdxRef.current = idx;
      } else if (typeof data.stopAngle === 'number') {
        targetAngle = data.stopAngle;
        selectedIdxRef.current = null;
      }
      if (targetAngle === null) { preWheel.stopAnimation(false); setIsSpinning(false); return; }

      const carryAngle = ((preWheel.rotationAngle % 360) + 360) % 360;
      preWheel.stopAnimation(false);

      const finalWheel = new WinwheelClass({
        canvasId: canvasRef.current!.id,
        numSegments: segmentsRef.current.length,
        outerRadius: preWheel.outerRadius,
        pointerAngle: 90,
        rotationAngle: carryAngle,
        drawMode: 'image',
        textFontSize: 0,
        segments: segmentsRef.current,
        animation: {
          type: 'spinToStop',
          duration: Math.max(4, durationSec),
          spins: Math.max(6, Math.floor(spins / 2)),
          callbackFinished: () => {
            try {
              const seg = finalWheel.getIndicatedSegment?.() ?? null;
              if (seg && seg.text) {
                const pickedIdx = selectedIdxRef.current;
                const safeText = (pickedIdx !== null && segmentsRef.current[pickedIdx]) ? (segmentsRef.current[pickedIdx].text ?? seg.text) : seg.text;
                setMessage(safeText ?? '');
                fireConfettiIfWin(safeText ?? seg.text ?? '');
                if (typeof onFinishedRef.current === 'function') onFinishedRef.current(seg.text);
              }
            } finally {
              setIsSpinning(false);
            }
          },
        },
        pins: { number: 0 },
      });
      if (wheelImageRef.current) finalWheel.wheelImage = wheelImageRef.current;
      finalWheel.animation!.stopAngle = targetAngle;
      finalWheel.draw();
      wheelInstanceRef.current = finalWheel;
      finalWheel.startAnimation();
    } catch {
      try { prev.stopAnimation(false); } catch {}
      setIsSpinning(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative">

        {/* Canvas da roleta (com máscara circular para esconder sobras da imagem) */}
        <canvas
          ref={canvasRef}
          id="winwheel-canvas"
          width={wheelSizePx}
          height={wheelSizePx}
          className="block rounded-full bg-transparent"
          style={imageScale !== 1 ? { transform: `scale(${imageScale})`, transformOrigin: 'center' } : undefined}
        />

        {centerOverlaySrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={centerOverlaySrc}
            alt="Gire"
            width={centerOverlaySizePx}
            height={centerOverlaySizePx}
            className="pointer-events-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          />
        )}
      </div>

      <button
        onClick={handleSpin}
        disabled={isSpinning || !ready || !imageLoaded || disabled}
        className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#28a745] hover:bg-green-700 text-white font-bold disabled:opacity-60 disabled:cursor-not-allowed shadow-md transition-colors"
      >
        {isSpinning ? 'Girando...' : 'Girar roleta'}
      </button>

      {message && (
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-gray-100 rounded-lg px-3 py-2 text-center shadow-inner">
            <p className="text-xs font-semibold text-gray-600">Resultado</p>
            <p className="text-sm sm:text-base text-gray-800 font-bold mt-1">
              Você caiu em: <span className="font-extrabold text-gray-900">{message}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


