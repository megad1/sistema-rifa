'use client';

import { useEffect, useRef, useState } from 'react';

type WinwheelSegment = { text?: string };

interface WinwheelInstance {
  outerRadius: number;
  stopAnimation: (canComplete?: boolean) => void;
  rotationAngle: number;
  draw: () => void;
  startAnimation: () => void;
  getIndicatedSegment?: () => WinwheelSegment | null;
  wheelImage?: HTMLImageElement | HTMLCanvasElement;
}

type WinwheelCtor = new (config: Record<string, unknown>) => WinwheelInstance;

declare global {
  interface Window {
    Winwheel?: WinwheelCtor;
    TweenMax?: unknown;
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
  onSpinStart?: () => boolean | void;
  onFinished?: (resultLabel: string) => void;
}

export default function WinwheelRoulette({
  imageSrc,
  wheelSizePx = 360,
  angleOffsetDeg = 0,
  segments: segmentLabels = [
    'CARRO 0KM',
    'TENTE OUTRA VEZ',
    '15 MIL REAIS',
    'TENTE OUTRA VEZ',
    '12 MIL REAIS',
    'iPhone 16 Pro Max',
  ],
  spins = 7,
  durationSec = 5,
  paddingPx,
  imageScale = 1,
  imageFitScale = 0.995,
  disabled = false,
  onSpinStart,
  onFinished,
}: WinwheelRouletteProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wheelInstanceRef = useRef<WinwheelInstance | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    let checkInterval: number | null = null;

    function initIfReady() {
      if (!canvasRef.current) return;
      if (typeof window === 'undefined') return;
      if (!window.Winwheel) return;
      if (typeof window.TweenMax === 'undefined') return; // GSAP v2 necessário
      if (wheelInstanceRef.current) return; // já inicializado

      // Cria segmentos apenas para fins de lógica/resultado
      const segments = segmentLabels.map((label) => ({ text: label }));

      const computedPct = Math.ceil(wheelSizePx * 0.015);
      const effectivePadding = paddingPx ?? Math.max(0, computedPct);

      const theWheel = new window.Winwheel({
        canvasId: canvasRef.current.id,
        numSegments: segments.length,
        outerRadius: Math.max(10, Math.floor(wheelSizePx / 2) - Math.max(1, effectivePadding)),
        pointerAngle: 90, // ponteiro no topo
        rotationAngle: angleOffsetDeg,
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
            if (typeof onFinished === 'function') onFinished(seg.text);
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
  }, [
    angleOffsetDeg,
    durationSec,
    imageFitScale,
    imageSrc,
    paddingPx,
    segmentLabels,
    spins,
    wheelSizePx,
    onFinished,
  ]);

  const handleSpin = () => {
    if (!wheelInstanceRef.current || isSpinning || !ready || !imageLoaded || disabled) return;
    const allow = onSpinStart ? onSpinStart() : true;
    if (allow === false) return;
    setMessage('');
    setIsSpinning(true);

    // Reset opcional para permitir giros múltiplos
    try {
      wheelInstanceRef.current.stopAnimation(false);
      // não resetamos mais o ângulo; iniciamos do ângulo atual para evitar "snap back"
      wheelInstanceRef.current.draw();
    } catch {}

    wheelInstanceRef.current.startAnimation();
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


