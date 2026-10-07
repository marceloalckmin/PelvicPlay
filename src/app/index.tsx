import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { usePoseMapeamento } from '../../src/hooks/usePoseMapeamento';
import { Landmark, PoseDetectorModule } from '../../src/native/PosePlugin';

export default function HomeScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const emProcessamento = useRef(false);
  const cameraReadyRef = useRef(false);
  const [logStatus, setLogStatus] = useState<string>('Iniciando...');
  const [resultadoCalibracao, setResultadoCalibracao] = useState<any>(null);

  // Hook da matemática de calibração corporal
  const mapeamento = usePoseMapeamento();

  const photoOutput = usePhotoOutput({
    qualityPrioritization: 'speed',
    quality: 0.5,
  });

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    let ativo = true;

    PoseDetectorModule.inicializar()
      .then(() => {
        console.log('✅ MediaPipe Inicializado com Sucesso!');
        setLogStatus('MediaPipe Inicializado OK!');
      })
      .catch((e) => {
        console.log('❌ Erro ao Inicializar MediaPipe:', e);
        setLogStatus(`Erro Init: ${e?.message || e}`);
      });

    const timer = setInterval(async () => {
      if (
        !ativo ||
        emProcessamento.current ||
        !photoOutput ||
        !cameraReadyRef.current
      ) return;

      emProcessamento.current = true;

      let photo: any = null;

      try {
        photo = await photoOutput.capturePhoto({
          enableShutterSound: false,
        }, {});

        const path = await photo.saveToTemporaryFileAsync();

        if (path) {
          const landmarks: Landmark[] = await PoseDetectorModule.processarFrame(path);

          if (ativo && landmarks && landmarks.length >= 33) {
            const larguraTela = 720;
            const alturaTela = 1280;

            // Executa a trigonometria nos 33 pontos recebidos
            const res = mapeamento.verificar(landmarks, larguraTela, alturaTela);
            setResultadoCalibracao(res);

            console.log(`
--------------------------------------------------
📐 CÁLCULO DE ÂNGULOS DAS ARTICULAÇÕES:
- Cotovelo Esquerdo: ${res.angulos.cotovelo_esq}°
- Cotovelo Direito:  ${res.angulos.cotovelo_dir}°
- Joelho Esquerdo:   ${res.angulos.joelho_esq}°
- Joelho Direito:    ${res.angulos.joelho_dir}°
- Pose Anatômica OK: ${res.pose_ok ? '✅ SIM' : '❌ NÃO'}
- Cronômetro: ${res.tempo_segurando.toFixed(1)}s / ${res.tempo_alvo}s
--------------------------------------------------
            `);

            setLogStatus(`Cotovelos: ${res.angulos.cotovelo_esq}° / ${res.angulos.cotovelo_dir}°`);
          } else {
            setResultadoCalibracao(null);
          }
        }
      } catch (e: any) {
        console.log('❌ Erro durante captura:', e?.message || e);
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
  }, [photoOutput]);

  const mensagemTela = () => {
    if (!resultadoCalibracao) return '🔴 Aguardando enquadramento...';
    if (resultadoCalibracao.finalizado) return '🎉 CALIBRAÇÃO CONCLUÍDA COM SUCESSO!';
    if (resultadoCalibracao.pose_ok) {
      return `🟢 Pose OK! Segure... ${Math.ceil(resultadoCalibracao.tempo_segurando)}s / ${resultadoCalibracao.tempo_alvo}s`;
    }
    return '🟡 Fique em posição reta (braços e pernas esticados)';
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
            console.log('🎥 CameraSession configurada!');
            cameraReadyRef.current = true;
            setLogStatus('Câmera configurada! Avaliando pose...');
          }}
          onError={(error) => {
            console.log('❌ Erro da câmera:', error);
            cameraReadyRef.current = false;
            setLogStatus(`Erro Camera: ${error?.message || error}`);
          }}
        />
      )}

      <View style={styles.overlay}>
        <Text style={styles.textoMain}>{mensagemTela()}</Text>

        {resultadoCalibracao && (
          <View style={styles.boxAngulos}>
            <Text style={styles.textoAngulo}>
              Cotovelos: L({resultadoCalibracao.angulos.cotovelo_esq}°) R({resultadoCalibracao.angulos.cotovelo_dir}°)
            </Text>
            <Text style={styles.textoAngulo}>
              Joelhos: L({resultadoCalibracao.angulos.joelho_esq}°) R({resultadoCalibracao.angulos.joelho_dir}°)
            </Text>
          </View>
        )}

        <Text style={styles.subtexto}>Status: {logStatus}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  textoMain: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  boxAngulos: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 10,
    borderRadius: 8,
    gap: 4,
  },
  textoAngulo: {
    color: '#34D399',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  subtexto: {
    color: '#AAA',
    fontSize: 12,
    textAlign: 'center',
  },
});