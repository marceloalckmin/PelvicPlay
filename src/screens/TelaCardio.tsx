import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CORES } from './theme';

export default function TelaCardio({ exercicio }: { exercicio: any }) {
  const [minutos, setMinutos] = useState('');
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null);
  const [rodando, setRodando] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function iniciar() {
    const mins = parseInt(minutos);
    if (!mins || mins <= 0) {
      Alert.alert('Atenção', 'Digite um tempo válido em minutos.');
      return;
    }
    setSegundosRestantes(mins * 60);
    setRodando(true);
  }

  function pausar() {
    setRodando(false);
  }

  function reiniciar() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRodando(false);
    setSegundosRestantes(null);
    setMinutos('');
  }

  useEffect(() => {
    if (rodando && segundosRestantes !== null) {
      intervalRef.current = setInterval(() => {
        setSegundosRestantes((s) => {
          if (s === null || s <= 1) {
            clearInterval(intervalRef.current!);
            setRodando(false);
            Alert.alert('🎉 Parabéns!', 'Você completou o exercício!', [
              { text: 'Voltar', onPress: () => router.back() },
            ]);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [rodando]);

  function formatarTempo(s: number) {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const seg = (s % 60).toString().padStart(2, '0');
    return `${m}:${seg}`;
  }

  const progresso = segundosRestantes !== null && minutos
    ? 1 - segundosRestantes / (parseInt(minutos) * 60)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{exercicio?.nome || 'Cardio'}</Text>
      </View>

      <View style={styles.conteudo}>
        <View style={styles.gifWrap}>
          <Image
            source={require('../assets/bicicleta.gif')}
            style={styles.gif}
            resizeMode="contain"
          />
        </View>

        {segundosRestantes === null ? (
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Quanto tempo? (minutos)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={minutos}
              onChangeText={setMinutos}
              placeholder="Ex: 20"
              placeholderTextColor={CORES.textoMuted}
              maxLength={3}
            />
            <TouchableOpacity style={styles.botao} onPress={iniciar}>
              <Text style={styles.botaoTexto}>▶ Começar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timerWrap}>
            <Text style={styles.timerTexto}>{formatarTempo(segundosRestantes)}</Text>
            <View style={styles.barraFundo}>
              <View style={[styles.barraPreenchida, { width: `${progresso * 100}%` }]} />
            </View>

            <View style={styles.botoesRow}>
              <TouchableOpacity style={styles.botaoSecundario} onPress={rodando ? pausar : iniciar}>
                <Text style={styles.botaoSecundarioTexto}>{rodando ? '⏸ Pausar' : '▶ Retomar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botaoPerigo} onPress={reiniciar}>
                <Text style={styles.botaoTexto}>✕ Reiniciar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundoClaro },
  header: { backgroundColor: CORES.azul, paddingHorizontal: 20, paddingVertical: 16, gap: 4 },
  voltar: { color: CORES.amarelo, fontSize: 14, fontWeight: '600' },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: CORES.branco },
  conteudo: { flex: 1, padding: 20, gap: 24, alignItems: 'center' },
  gifWrap: { width: '100%', height: 220, backgroundColor: CORES.branco, borderRadius: 20, alignItems: 'center', justifyContent: 'center', elevation: 1 },
  gif: { width: '90%', height: '90%' },
  inputWrap: { width: '100%', gap: 12, alignItems: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: CORES.textoTitulo },
  input: { width: '60%', backgroundColor: CORES.branco, borderRadius: 12, padding: 14, fontSize: 24, fontWeight: '700', textAlign: 'center', color: CORES.textoTitulo, elevation: 1 },
  timerWrap: { width: '100%', alignItems: 'center', gap: 20 },
  timerTexto: { fontSize: 72, fontWeight: '700', color: CORES.azul, letterSpacing: 2 },
  barraFundo: { width: '100%', height: 8, backgroundColor: '#E0E4F0', borderRadius: 4, overflow: 'hidden' },
  barraPreenchida: { height: '100%', backgroundColor: CORES.amarelo, borderRadius: 4 },
  botoesRow: { flexDirection: 'row', gap: 12, width: '100%' },
  botao: { backgroundColor: CORES.amarelo, borderRadius: 14, padding: 16, alignItems: 'center', width: '100%' },
  botaoSecundario: { flex: 1, backgroundColor: CORES.azul, borderRadius: 14, padding: 14, alignItems: 'center' },
  botaoSecundarioTexto: { fontSize: 14, fontWeight: '700', color: CORES.branco },
  botaoPerigo: { flex: 1, backgroundColor: '#EF4444', borderRadius: 14, padding: 14, alignItems: 'center' },
  botaoTexto: { fontSize: 15, fontWeight: '700', color: CORES.textoTitulo },
});