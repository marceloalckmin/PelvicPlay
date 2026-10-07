import { useCallback, useRef } from 'react';
import { calcularAngulo, calcularDistancia } from '../utils';
import { LP, Landmark, toPixel } from './usePoseMapeamento';

// Espelha exatamente o sapinho_relaxado_frente.py
const TEMPO_FINAL       = 5;
const MARGEM_JOELHO     = 20;
const MARGEM_QUADRIL    = 20;
const MARGEM_COTOVELO   = 15;
const RATIO_JOELHOS_MIN = 1.5;

type Estado = 'aguardando' | 'executando' | 'posicao_final' | 'finalizado';

export type ResultadoExercicio = {
  estado: Estado;
  finalizado: boolean;
  progresso: number;
  tempo_segurando: number;
  tempo_alvo: number;
  score: number | null;    // 0.0 a 1.0 (sem DTW por ora, será adicionado depois)
  na_posicao_final: boolean;
  dados: {
    joelho_esq: number;
    joelho_dir: number;
    quadril_esq: number;
    quadril_dir: number;
  };
};

export function useSapinhoRelaxado() {
  const estadoRef      = useRef<Estado>('aguardando');
  const inicioFinalRef = useRef<number | null>(null);
  const scoreRef       = useRef<number | null>(null);

  const calcularMetricas = (landmarks: Landmark[], w: number, h: number) => {
    const px = (idx: number): [number, number] => toPixel(landmarks[idx], w, h);

    const angulos = {
      cotovelo_esq: calcularAngulo(px(LP.LEFT_SHOULDER),  px(LP.LEFT_ELBOW),  px(LP.LEFT_WRIST)),
      cotovelo_dir: calcularAngulo(px(LP.RIGHT_SHOULDER), px(LP.RIGHT_ELBOW), px(LP.RIGHT_WRIST)),
      quadril_esq:  calcularAngulo(px(LP.LEFT_SHOULDER),  px(LP.LEFT_HIP),    px(LP.LEFT_KNEE)),
      quadril_dir:  calcularAngulo(px(LP.RIGHT_SHOULDER), px(LP.RIGHT_HIP),   px(LP.RIGHT_KNEE)),
      joelho_esq:   calcularAngulo(px(LP.LEFT_HIP),       px(LP.LEFT_KNEE),   px(LP.LEFT_ANKLE)),
      joelho_dir:   calcularAngulo(px(LP.RIGHT_HIP),      px(LP.RIGHT_KNEE),  px(LP.RIGHT_ANKLE)),
    };

    const distancias = {
      largura_ombros:   calcularDistancia(px(LP.LEFT_SHOULDER), px(LP.RIGHT_SHOULDER)),
      abertura_joelhos: calcularDistancia(px(LP.LEFT_KNEE),     px(LP.RIGHT_KNEE)),
    };

    return { angulos, distancias };
  };

  const naPosicaoFinal = (
    angulos: ReturnType<typeof calcularMetricas>['angulos'],
    distancias: ReturnType<typeof calcularMetricas>['distancias']
  ) => {
    const joelhoOk =
      Math.abs(angulos.joelho_esq - 50) <= MARGEM_JOELHO &&
      Math.abs(angulos.joelho_dir - 50) <= MARGEM_JOELHO;

    const quadrilOk =
      Math.abs(angulos.quadril_esq - 48) <= MARGEM_QUADRIL &&
      Math.abs(angulos.quadril_dir - 48) <= MARGEM_QUADRIL;

    const cotoveloOk =
      Math.abs(angulos.cotovelo_esq - 180) <= MARGEM_COTOVELO &&
      Math.abs(angulos.cotovelo_dir - 180) <= MARGEM_COTOVELO;

    const ratioOk =
      distancias.largura_ombros > 0 &&
      distancias.abertura_joelhos / distancias.largura_ombros >= RATIO_JOELHOS_MIN;

    return joelhoOk && quadrilOk && cotoveloOk && ratioOk;
  };

  const movimentoIniciado = (angulos: ReturnType<typeof calcularMetricas>['angulos']) =>
    angulos.quadril_esq < 150 || angulos.quadril_dir < 150;

  const verificar = useCallback((
    landmarks: Landmark[],
    w: number,
    h: number
  ): ResultadoExercicio => {
    const { angulos, distancias } = calcularMetricas(landmarks, w, h);
    const agora = Date.now() / 1000;

    const resultado = (): ResultadoExercicio => ({
      estado: estadoRef.current,
      finalizado: estadoRef.current === 'finalizado',
      progresso: 0,
      tempo_segurando: 0,
      tempo_alvo: TEMPO_FINAL,
      score: scoreRef.current,
      na_posicao_final: estadoRef.current === 'posicao_final' || estadoRef.current === 'finalizado',
      dados: {
        joelho_esq:  Math.round(angulos.joelho_esq),
        joelho_dir:  Math.round(angulos.joelho_dir),
        quadril_esq: Math.round(angulos.quadril_esq),
        quadril_dir: Math.round(angulos.quadril_dir),
      },
    });

    if (estadoRef.current === 'finalizado') return { ...resultado(), progresso: 1 };

    // aguardando → executando
    if (['aguardando', 'executando'].includes(estadoRef.current)) {
      if (movimentoIniciado(angulos)) estadoRef.current = 'executando';
    }

    // executando → posicao_final
    if (estadoRef.current === 'executando' && naPosicaoFinal(angulos, distancias)) {
      estadoRef.current = 'posicao_final';
      inicioFinalRef.current = agora;
    }

    // posicao_final: contar tempo
    if (estadoRef.current === 'posicao_final') {
      if (!naPosicaoFinal(angulos, distancias)) {
        estadoRef.current = 'executando';
        inicioFinalRef.current = null;
        return resultado();
      }

      const tempoSegurando = agora - (inicioFinalRef.current ?? agora);
      const progresso = Math.min(tempoSegurando / TEMPO_FINAL, 1.0);

      if (tempoSegurando >= TEMPO_FINAL) {
        estadoRef.current = 'finalizado';
        scoreRef.current = null; // DTW será integrado depois
        return { ...resultado(), progresso: 1, tempo_segurando: TEMPO_FINAL };
      }

      return { ...resultado(), progresso, tempo_segurando: tempoSegurando };
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