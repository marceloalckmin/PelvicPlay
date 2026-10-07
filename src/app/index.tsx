import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { Landmark, PoseDetectorModule } from '../../src/native/PosePlugin';

export default function HomeScreen() {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const emProcessamento = useRef(false);
  const cameraReadyRef = useRef(false);
  const [pontos, setPontos] = useState<number>(0);
  const [detalhesArticulacoes, setDetalhesArticulacoes] = useState<string>('Aguardando detecção...');
  const [logStatus, setLogStatus] = useState<string>('Iniciando...');

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
      console.log('🔄 Iniciando captura de foto...');

      const safetyTimeout = setTimeout(() => {
        if (emProcessamento.current) {
          console.log('⚠️ Captura demorou demais. Destravando...');
          emProcessamento.current = false;
        }
      }, 1500);

      let photo: any = null;

      try {
        // Captura
        photo = await photoOutput.capturePhoto({
          enableShutterSound: false,
        }, {});

        console.log('📷 Foto capturada com sucesso!');

        // Salva a Photo em um arquivo temporário
        const path = await photo.saveToTemporaryFileAsync();

        if (path) {
          console.log('📁 Arquivo salvo:', path);
          setLogStatus(`Foto: ${path.split('/').pop()}`);

          // Envia o caminho para o MediaPipe
          const landmarks: Landmark[] = await PoseDetectorModule.processarFrame(path);

          if (ativo && landmarks) {
            setPontos(landmarks.length);
            console.log(`📌 Retorno do MediaPipe: ${landmarks.length} pontos`);

            // Leitura e formatação dos Ombros e Joelhos
            if (landmarks.length >= 33) {
              const ombroEsq = landmarks[11];
              const ombroDir = landmarks[12];
              const joelhoEsq = landmarks[25];
              const joelhoDir = landmarks[26];

              console.log(`
--------------------------------------------------
🟢 POSE DETECTADA (33 PONTOS):
- Ombro Esquerdo  (Ponto 11): x=${ombroEsq.x.toFixed(2)}, y=${ombroEsq.y.toFixed(2)}, vis=${ombroEsq.visibility.toFixed(2)}
- Ombro Direito   (Ponto 12): x=${ombroDir.x.toFixed(2)}, y=${ombroDir.y.toFixed(2)}, vis=${ombroDir.visibility.toFixed(2)}
- Joelho Esquerdo (Ponto 25): x=${joelhoEsq.x.toFixed(2)}, y=${joelhoEsq.y.toFixed(2)}, vis=${joelhoEsq.visibility.toFixed(2)}
- Joelho Direito  (Ponto 26): x=${joelhoDir.x.toFixed(2)}, y=${joelhoDir.y.toFixed(2)}, vis=${joelhoDir.visibility.toFixed(2)}
--------------------------------------------------
              `);

              setDetalhesArticulacoes(
                `Ombros: L(${ombroEsq.x.toFixed(2)}, ${ombroEsq.y.toFixed(2)}) R(${ombroDir.x.toFixed(2)}, ${ombroDir.y.toFixed(2)})\n` +
                `Joelhos: L(${joelhoEsq.x.toFixed(2)}, ${joelhoEsq.y.toFixed(2)}) R(${joelhoDir.x.toFixed(2)}, ${joelhoDir.y.toFixed(2)})`
              );
            } else {
              setDetalhesArticulacoes('🔴 Nenhuma pose detectada');
            }
          }
        } else {
          console.log('⚠️ Não foi possível salvar a foto!');
          setLogStatus('Erro ao salvar foto');
        }

      } catch (e: any) {
        console.log('❌ Erro durante captura:', e?.message || e);
        setLogStatus(`Erro Captura: ${e?.message || e}`);
      } finally {
        clearTimeout(safetyTimeout);

        if (photo) {
          photo.dispose();
        }

        setTimeout(() => {
          emProcessamento.current = false;
        }, 300);
      }
    }, 500);

    return () => {
      ativo = false;
      clearInterval(timer);
      PoseDetectorModule.finalizar().catch(() => {});
    };
  }, [photoOutput]);

  return (
    <View style={styles.container}>
      {device && (
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}

          // ALTERAÇÃO 1:
          // PhotoOutput agora é conectado através de outputs
          outputs={[photoOutput]}

          // ALTERAÇÃO 2:
          // Espera a CameraSession estar configurada
          onConfigured={() => {
            console.log('🎥 CameraSession configurada!');
            console.log('📷 PhotoOutput conectado!');
            cameraReadyRef.current = true;
            setLogStatus('Câmera configurada! Capturando...');
          }}

          onError={(error) => {
            console.log('❌ Erro da câmera:', error);
            cameraReadyRef.current = false;
            setLogStatus(`Erro Camera: ${error?.message || error}`);
          }}
        />
      )}

      <View style={styles.overlay}>
        <Text style={styles.texto}>
          {pontos > 0
            ? `🟢 Pose Detectada: ${pontos} pontos`
            : '🔴 Aguardando corpo na câmera...'}
        </Text>

        <Text style={styles.detalhes}>{detalhesArticulacoes}</Text>

        <Text style={styles.subtexto}>
          Status: {logStatus}
        </Text>
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
    gap: 6,
  },

  texto: {
    color: '#FFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  detalhes: {
    color: '#34D399',
    fontSize: 13,
    textAlign: 'center',
    fontFamily: 'monospace',
    lineHeight: 18,
  },

  subtexto: {
    color: '#AAA',
    fontSize: 12,
    textAlign: 'center',
  },
});