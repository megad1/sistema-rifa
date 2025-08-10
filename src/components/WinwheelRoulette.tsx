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
    // Ordem exata no sentido horário com centros em: 0°, 60°, 120°, 180°, 240°, 300°
    'CARRO 0KM',
    'TENTE OUTRA VEZ', // direita
    '2 iPhone 16 Pro Max',
    '12 MIL REAIS',
    'TENTE OUTRA VEZ', // esquerda
    '15 MIL REAIS',
  ],
  spins = 7,
  durationSec = 5,
  paddingPx,
  imageScale = 1,
  imageFitScale = 0.995,
  disabled = false,
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

  useEffect(() => {
    let checkInterval: number | null = null;

    function initIfReady() {
      if (!canvasRef.current) return;
      if (typeof window === 'undefined') return;
      if (!window.Winwheel) return;
      if (typeof window.TweenMax === 'undefined') return; // GSAP v2 necessário
      if (wheelInstanceRef.current) return; // já inicializado

      // Cria segmentos com tamanhos específicos conforme mapeamento enviado
      const sizesDeg = [60.85, 60.784, 54.945, 61.429, 58.604, 63.388];
      const segments = segmentLabels.map((label, idx) => ({ text: label, size: sizesDeg[idx] ?? (360 / segmentLabels.length) }));
      segmentsRef.current = segments;

      const computedPct = Math.ceil(wheelSizePx * 0.015);
      const effectivePadding = paddingPx ?? Math.max(0, computedPct);

      // Alinha o centro do primeiro segmento (CARRO 0KM) em 30.425° => rotação inicial -30.425°
      const effectiveRotation = -30.425 + angleOffsetDeg;
      const theWheel = new window.Winwheel({
        canvasId: canvasRef.current.id,
        numSegments: segments.length,
        outerRadius: Math.max(10, Math.floor(wheelSizePx / 2) - Math.max(1, effectivePadding)),
        // Mantemos o ponteiro lógico em 90° para que a seta à direita represente 90°
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

  const handleSpin = () => {
    if (!wheelInstanceRef.current || isSpinning || !ready || !imageLoaded || disabled) return;
    const allow = onSpinStartRef.current ? onSpinStartRef.current() : true;
    if (allow === false) return;
    setMessage('');
    setIsSpinning(true);

    // Reset opcional para permitir giros múltiplos
    try {
      const prev = wheelInstanceRef.current;
      prev.stopAnimation(false);
      // Mata qualquer tween residual do GSAP na instância anterior
      try {
        const tm = window.TweenMax;
        tm?.killTweensOf?.(prev);
        tm?.killDelayedCallsTo?.(prev);
        tm?.killAll?.(false, true, true);
      } catch {}

      const currentAngle = ((prev.rotationAngle % 360) + 360) % 360;

      // Recria totalmente a instância para evitar qualquer timeline residual do GSAP
      const newWheel = new window.Winwheel({
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
          duration: Math.max(5, durationSec),
          spins: Math.max(10, Math.floor(spins) + Math.floor(Math.random() * 4)),
          callbackFinished: () => {
            try {
              const seg = newWheel.getIndicatedSegment?.() ?? null;
              if (seg && seg.text) {
                setMessage(seg.text);
                if (typeof onFinishedRef.current === 'function') onFinishedRef.current(seg.text);
              }
            } finally {
              setIsSpinning(false);
            }
          },
        },
        pins: { number: 0 },
      });

      if (wheelImageRef.current) {
        newWheel.wheelImage = wheelImageRef.current;
      }
      // Garantia extra: remover qualquer stopAngle
      if (newWheel.animation) newWheel.animation.stopAngle = null;
      newWheel.draw();
      wheelInstanceRef.current = newWheel;
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


