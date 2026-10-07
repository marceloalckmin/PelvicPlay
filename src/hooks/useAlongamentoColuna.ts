import { useCallback, useRef } from 'react';
import { calcularAngulo } from '../utils';
import { LP, Landmark, toPixel } from './usePoseMapeamento';

// Espelha exatamente o alongamento_coluna.py
const TEMPO_FINAL     = 5;
const MARGEM_JOELHO   = 20;
const MARGEM_QUADRIL  = 20;
const MARGEM_COTOVELO = 20;
const MARGEM_OMBRO    = 25;

type Estado = 'aguardando' | 'executando' | 'posicao_final' | 'finalizado';

export type ResultadoAlongamento = {
  estado: Estado;
  finalizado: boolean;
  progresso: number;
  tempo_segurando: number;
  tempo_alvo: number;
  score: number | null;
  na_posicao_final: boolean;
  dados: {
    cotovelo_esq: number;
    cotovelo_dir: number;
    ombro_esq: number;
    ombro_dir: number;
    quadril_esq: number;
    quadril_dir: number;
    joelho_esq: number;
    joelho_dir: number;
  };
};

export function useAlongamentoColuna() {
  const estadoRef      = useRef<Estado>('aguardando');
  const inicioFinalRef = useRef<number | null>(null);
  const scoreRef       = useRef<number | null>(null);

  const calcularMetricas = (landmarks: Landmark[], w: number, h: number) => {
    const px = (idx: number): [number, number] => toPixel(landmarks[idx], w, h);

    return {
      cotovelo_esq: calcularAngulo(px(LP.LEFT_SHOULDER),  px(LP.LEFT_ELBOW),   px(LP.LEFT_WRIST)),
      cotovelo_dir: calcularAngulo(px(LP.RIGHT_SHOULDER), px(LP.RIGHT_ELBOW),  px(LP.RIGHT_WRIST)),
      ombro_esq:    calcularAngulo(px(LP.LEFT_HIP),       px(LP.LEFT_SHOULDER),px(LP.LEFT_ELBOW)),
      ombro_dir:    calcularAngulo(px(LP.RIGHT_HIP),      px(LP.RIGHT_SHOULDER),px(LP.RIGHT_ELBOW)),
      quadril_esq:  calcularAngulo(px(LP.LEFT_SHOULDER),  px(LP.LEFT_HIP),     px(LP.LEFT_KNEE)),
      quadril_dir:  calcularAngulo(px(LP.RIGHT_SHOULDER), px(LP.RIGHT_HIP),    px(LP.RIGHT_KNEE)),
      joelho_esq:   calcularAngulo(px(LP.LEFT_HIP),       px(LP.LEFT_KNEE),    px(LP.LEFT_ANKLE)),
      joelho_dir:   calcularAngulo(px(LP.RIGHT_HIP),      px(LP.RIGHT_KNEE),   px(LP.RIGHT_ANKLE)),
    };
  };

  const naPosicaoFinal = (a: ReturnType<typeof calcularMetricas>) =>
    Math.abs(a.joelho_esq   - 40)  <= MARGEM_JOELHO   &&
    Math.abs(a.joelho_dir   - 40)  <= MARGEM_JOELHO   &&
    Math.abs(a.quadril_esq  - 45)  <= MARGEM_QUADRIL  &&
    Math.abs(a.quadril_dir  - 45)  <= MARGEM_QUADRIL  &&
    Math.abs(a.cotovelo_esq - 180) <= MARGEM_COTOVELO &&
    Math.abs(a.cotovelo_dir - 180) <= MARGEM_COTOVELO &&
    Math.abs(a.ombro_esq    - 160) <= MARGEM_OMBRO    &&
    Math.abs(a.ombro_dir    - 160) <= MARGEM_OMBRO;

  const movimentoIniciado = (a: ReturnType<typeof calcularMetricas>) =>
    a.quadril_esq < 140 || a.quadril_dir < 140;

  const verificar = useCallback((
    landmarks: Landmark[],
    w: number,
    h: number
  ): ResultadoAlongamento => {
    const a = calcularMetricas(landmarks, w, h);
    const agora = Date.now() / 1000;

    const resultado = (progresso = 0, tempoSegurando = 0): ResultadoAlongamento => ({
      estado: estadoRef.current,
      finalizado: estadoRef.current === 'finalizado',
      progresso,
      tempo_segurando: tempoSegurando,
      tempo_alvo: TEMPO_FINAL,
      score: scoreRef.current,
      na_posicao_final: ['posicao_final', 'finalizado'].includes(estadoRef.current),
      dados: {
        cotovelo_esq: Math.round(a.cotovelo_esq),
        cotovelo_dir: Math.round(a.cotovelo_dir),
        ombro_esq:    Math.round(a.ombro_esq),
        ombro_dir:    Math.round(a.ombro_dir),
        quadril_esq:  Math.round(a.quadril_esq),
        quadril_dir:  Math.round(a.quadril_dir),
        joelho_esq:   Math.round(a.joelho_esq),
        joelho_dir:   Math.round(a.joelho_dir),
      },
    });

    if (estadoRef.current === 'finalizado') return resultado(1, TEMPO_FINAL);

    if (['aguardando', 'executando'].includes(estadoRef.current)) {
      if (movimentoIniciado(a)) estadoRef.current = 'executando';
    }

    if (estadoRef.current === 'executando' && naPosicaoFinal(a)) {
      estadoRef.current = 'posicao_final';
      inicioFinalRef.current = agora;
    }

    if (estadoRef.current === 'posicao_final') {
      if (!naPosicaoFinal(a)) {
        estadoRef.current = 'executando';
        inicioFinalRef.current = null;
        return resultado();
      }

      const tempo = agora - (inicioFinalRef.current ?? agora);
      const progresso = Math.min(tempo / TEMPO_FINAL, 1.0);

      if (tempo >= TEMPO_FINAL) {
        estadoRef.current = 'finalizado';
        scoreRef.current = null;
        return resultado(1, TEMPO_FINAL);
      }

      return resultado(progresso, tempo);
    }

    return resultado();
  }, []);

  const resetar = useCallback(() => {
    estadoRef.current = 'aguardando';
    inicioFinalRef.current = null;
    scoreRef.current = null;
  }, []);

  return { verificar, resetar };
}