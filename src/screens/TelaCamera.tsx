import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Camera,
    useCameraDevice,
    useCameraPermission,
    usePhotoOutput,
} from 'react-native-vision-camera';
import { useAlongamentoColuna } from '../hooks/useAlongamentoColuna';
import { Landmark, usePoseMapeamento } from '../hooks/usePoseMapeamento';
import { useSapinhoRelaxado } from '../hooks/useSapinhoRelaxado';
import { PoseDetectorModule } from '../native/PosePlugin';
import { CORES } from './theme';

const HOOK_POR_EXERCICIO: Record<string, string> = {
  'ex-1': 'sapinho',
  'ex-2': 'alongamento',
};

type Fase = 'mapeamento' | 'exercicio';

export default function TelaCamera({ exercicio }: { exercicio: any }) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');

  const [fase, setFase] = useState<Fase>('mapeamento');
  const [feedback, setFeedback] = useState<Record<string, any>>({});

  const emProcessamento = useRef(false);
  const cameraReadyRef = useRef(false);

  const mapeamento  = usePoseMapeamento();
  const sapinho     = useSapinhoRelaxado();
  const alongamento = useAlongamentoColuna();

  const photoOutput = usePhotoOutput({
    qualityPrioritization: 'speed',
    quality: 0.5,
  });

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const processarExercicio = useCallback((
    landmarks: Landmark[],
    w: number,
    h: number
  ) => {
    if (!exercicio) return null;
    const tipo = HOOK_POR_EXERCICIO[exercicio.id];
    if (tipo === 'sapinho')     return sapinho.verificar(landmarks, w, h);
    if (tipo === 'alongamento') return alongamento.verificar(landmarks, w, h);
    return null;
  }, [exercicio, sapinho, alongamento]);

  useEffect(() => {
    let ativo = true;

    PoseDetectorModule.inicializar().catch((e) =>
      console.log('MediaPipe init status:', e)
    );

    const timer = setInterval(async () => {
      if (!ativo || emProcessamento.current || !photoOutput || !cameraReadyRef.current) return;
      emProcessamento.current = true;

      let photo: any = null;

      try {
        // Captura Silenciosa sem som de obturador
        photo = await photoOutput.capturePhoto({
          enableShutterSound: false,
        }, {});

        const path = await photo.saveToTemporaryFileAsync();

        if (path) {
          const landmarks: Landmark[] = await PoseDetectorModule.processarFrame(path);

          if (ativo && landmarks && landmarks.length >= 33) {
            const w = 720;
            const h = 1280;

            if (fase === 'mapeamento') {
              const res = mapeamento.verificar(landmarks, w, h);
              setFeedback(res);
              if (res.finalizado) {
                setFase('exercicio');
              }
            } else {
              const res = processarExercicio(landmarks, w, h);
              if (res) setFeedback(res);
            }
          }
        }
      } catch (e) {
        // ignora erros de captura
      } finally {
        if (photo) photo.dispose();
        setTimeout(() => {
          emProcessamento.current = false;
        }, 200);
      }
    }, 400);

    return () => {
      ativo = false;
      clearInterval(timer);
      PoseDetectorModule.finalizar().catch(() => {});
    };
  }, [fase, mapeamento, processarExercicio, photoOutput]);

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.centralize}>
        <Text style={styles.textoEscuro}>Permissão de câmera necessária</Text>
        <TouchableOpacity style={styles.botaoAmarelo} onPress={requestPermission}>
          <Text style={styles.botaoTexto}>Permitir câmera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.centralize}>
        <Text style={styles.textoEscuro}>Câmera não encontrada</Text>
      </SafeAreaView>
    );
  }

  const progresso      = feedback?.progresso       ?? 0;
  const estado         = feedback?.estado          ?? 'aguardando';
  const angulos        = feedback?.angulos         ?? feedback?.dados ?? {};
  const finalizado     = feedback?.finalizado      ?? false;
  const tempoSegurando = feedback?.tempo_segurando ?? 0;
  const tempoAlvo      = feedback?.tempo_alvo      ?? 5;
  const score          = feedback?.score;

  const mensagemEstado = () => {
    if (fase === 'mapeamento') {
      if (feedback?.pose_ok) return `Segure... ${Math.ceil(tempoSegurando)}s`;
      return 'Fique em posição anatômica (braços e pernas retos)';
    }
    if (finalizado) return '🎉 Exercício concluído!';
    const msgs: Record<string, string> = {
      aguardando:    'Inicie o movimento',
      executando:    'Executando...',
      posicao_final: `Segure a posição! ${Math.ceil(tempoSegurando)} / ${tempoAlvo}s`,
      finalizado:    '🎉 Concluído!',
    };
    return msgs[estado] ?? estado;
  };

  return (
    <View style={styles.container}>
      {device && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          outputs={[photoOutput]}
          onConfigured={() => {
            cameraReadyRef.current = true;
          }}
        />
      )}

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.voltar}>‹ Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitulo}>{exercicio?.nome || 'Exercício'}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeTexto}>
              {fase === 'mapeamento' ? 'CALIBRAÇÃO' : 'EXECUTANDO'}
            </Text>
          </View>
        </View>

        {Object.keys(angulos).length > 0 && (
          <View style={styles.angulosBox}>
            {Object.entries(angulos).slice(0, 4).map(([chave, valor]) => (
              <View key={chave} style={styles.anguloRow}>
                <Text style={styles.anguloLabel}>
                  {chave.replace(/_/g, ' ')}
                </Text>
                <Text style={styles.anguloValor}>{String(valor)}°</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.rodape}>
          <Text style={styles.estadoTexto}>{mensagemEstado()}</Text>
          <View style={styles.barraFundo}>
            <View style={[
              styles.barraPreenchida,
              { width: `${Math.round(progresso * 100)}%` }
            ]} />
          </View>
          {finalizado && score != null && (
            <Text style={styles.scoreTexto}>
              Score: {Math.round(score * 100)}%
            </Text>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centralize: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: CORES.fundoClaro, gap: 16 },
  textoEscuro: { fontSize: 16, color: CORES.textoTitulo },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 20, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  voltar: { color: CORES.amarelo, fontSize: 14, fontWeight: '600' },
  headerTitulo: { flex: 1, fontSize: 15, fontWeight: '700', color: CORES.branco },
  badge: {
    backgroundColor: 'rgba(49,46,129,0.85)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  badgeTexto: { fontSize: 10, fontWeight: '700', color: '#C7D2FE' },
  angulosBox: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    marginHorizontal: 16, borderRadius: 12, padding: 12, gap: 6,
  },
  anguloRow: { flexDirection: 'row', justifyContent: 'space-between' },
  anguloLabel: { fontSize: 12, color: '#9CA8C4', textTransform: 'capitalize' },
  anguloValor: { fontSize: 12, fontWeight: '700', color: '#34D399' },
  rodape: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 16, gap: 10,
  },
  estadoTexto: { fontSize: 14, color: CORES.branco, textAlign: 'center', fontWeight: '600' },
  barraFundo: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 4, overflow: 'hidden',
  },
  barraPreenchida: { height: '100%', backgroundColor: CORES.amarelo, borderRadius: 4 },
  scoreTexto: { fontSize: 20, fontWeight: '700', color: CORES.amarelo, textAlign: 'center' },
  botaoAmarelo: {
    backgroundColor: CORES.amarelo, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  botaoTexto: { fontWeight: '700', color: CORES.textoTitulo },
});