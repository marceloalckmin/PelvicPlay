import { useCallback, useRef } from 'react';
import { calcularAngulo } from '../utils';

const MARGEM_ESTICADO = 30;  // 180° ± 20°
const TEMPO_SEGURANDO = 3;   // segundos
const VISIBILIDADE_MIN = 0.3; // Sensibilidade ideal para qualquer ambiente/posição

export type ResultadoMapeamento = {
  bracos_ok: boolean;
  pernas_ok: boolean;
  pose_ok: boolean;
  finalizado: boolean;
  progresso: number;
  tempo_segurando: number;
  tempo_alvo: number;
  angulos: {
    cotovelo_esq: number;
    cotovelo_dir: number;
    joelho_esq: number;
    joelho_dir: number;
  };
};

export const LP = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,    RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,    RIGHT_WRIST: 16,
  LEFT_HIP: 23,      RIGHT_HIP: 24,
  LEFT_KNEE: 25,     RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,    RIGHT_ANKLE: 28,
};

export type Landmark = {
  x: number;
  y: number;
  z: number;
  visibility: number;
};

export function toPixel(lm: Landmark, w: number, h: number): [number, number] {
  return [lm.x * w, lm.y * h];
}

export function usePoseMapeamento() {
  const finalizadoRef  = useRef(false);
  const inicioPoseRef  = useRef<number | null>(null);

  const verificar = useCallback((
    landmarks: Landmark[],
    w: number,
    h: number
  ): ResultadoMapeamento => {
    const px = (idx: number): [number, number] => {
      const lm = landmarks[idx] || { x: 0, y: 0, z: 0, visibility: 0 };
      return [lm.x * w, lm.y * h];
    };

    const visivel = (...idxs: number[]) =>
      idxs.every(i => (landmarks[i]?.visibility ?? 0) >= VISIBILIDADE_MIN);

    const bracosVisiveis =
      visivel(LP.LEFT_SHOULDER, LP.LEFT_ELBOW, LP.LEFT_WRIST) &&
      visivel(LP.RIGHT_SHOULDER, LP.RIGHT_ELBOW, LP.RIGHT_WRIST);

    const pernasVisiveis =
      visivel(LP.LEFT_HIP, LP.LEFT_KNEE, LP.LEFT_ANKLE) &&
      visivel(LP.RIGHT_HIP, LP.RIGHT_KNEE, LP.RIGHT_ANKLE);

    // Calcula os ângulos dos cotovelos se os braços estiverem visíveis
    const angCotoveloEsq = bracosVisiveis
      ? calcularAngulo(px(LP.LEFT_SHOULDER),  px(LP.LEFT_ELBOW),  px(LP.LEFT_WRIST))
      : 0;

    const angCotoveloDir = bracosVisiveis
      ? calcularAngulo(px(LP.RIGHT_SHOULDER), px(LP.RIGHT_ELBOW), px(LP.RIGHT_WRIST))
      : 0;

    // Calcula os joelhos se as pernas estiverem visíveis
    const angJoelhoEsq = pernasVisiveis
      ? calcularAngulo(px(LP.LEFT_HIP), px(LP.LEFT_KNEE), px(LP.LEFT_ANKLE))
      : 0;

    const angJoelhoDir = pernasVisiveis
      ? calcularAngulo(px(LP.RIGHT_HIP), px(LP.RIGHT_KNEE), px(LP.RIGHT_ANKLE))
      : 0;

    const esticado = (a: number) => Math.abs(a - 180) <= MARGEM_ESTICADO;

    const bracosOk = bracosVisiveis && esticado(angCotoveloEsq) && esticado(angCotoveloDir);
    const pernasOk = pernasVisiveis ? (esticado(angJoelhoEsq) && esticado(angJoelhoDir)) : true;
    const poseOk   = bracosOk && pernasOk;

    const agora = Date.now() / 1000;
    let progresso = 0;
    let tempoSegurando = 0;

    if (finalizadoRef.current) {
      progresso = 1.0;
      tempoSegurando = TEMPO_SEGURANDO;
    } else if (poseOk) {
      if (inicioPoseRef.current === null) inicioPoseRef.current = agora;
      tempoSegurando = agora - inicioPoseRef.current;
      progresso = Math.min(tempoSegurando / TEMPO_SEGURANDO, 1.0);
      if (tempoSegurando >= TEMPO_SEGURANDO) finalizadoRef.current = true;
    } else {
      inicioPoseRef.current = null;
    }

    return {
      bracos_ok: bracosOk,
      pernas_ok: pernasOk,
      pose_ok: poseOk,
      finalizado: finalizadoRef.current,
      progresso,
      tempo_segurando: tempoSegurando,
      tempo_alvo: TEMPO_SEGURANDO,
      angulos: {
        cotovelo_esq: Math.round(angCotoveloEsq),
        cotovelo_dir: Math.round(angCotoveloDir),
        joelho_esq:   Math.round(angJoelhoEsq),
        joelho_dir:   Math.round(angJoelhoDir),
      },
    };
  }, []);

  const resetar = useCallback(() => {
    finalizadoRef.current  = false;
    inicioPoseRef.current  = null;
  }, []);

  return { verificar, resetar };
}