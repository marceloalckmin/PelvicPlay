import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CORES } from './theme';

export default function TelaExercicio({ exercicio }: { exercicio: any }) {
  if (!exercicio) return null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.voltar}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{exercicio.nome}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.infoRow}>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillTexto}>⏱ {exercicio.duracaoMin} min</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillTexto}>📂 {exercicio.categoria}</Text>
          </View>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>DESCRIÇÃO</Text>
          <Text style={styles.blocoTexto}>{exercicio.descricao}</Text>
        </View>

        <View style={styles.bloco}>
          <Text style={styles.blocoTitulo}>COMO REALIZAR</Text>
          <Text style={styles.blocoTexto}>{exercicio.comoRealizar}</Text>
        </View>

        <TouchableOpacity
          style={styles.botao}
          activeOpacity={0.85}
          onPress={() => {
            if (exercicio.tipo === 'cardio') {
              router.push({
                pathname: '/cardio' as any,
                params: { exercicioJson: JSON.stringify(exercicio) },
              });
            } else {
              router.push({
                pathname: '/camera' as any,
                params: { exercicioJson: JSON.stringify(exercicio) },
              });
            }
          }}
        >
          <Text style={styles.botaoTexto}>▶ Começar exercício</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundoClaro },
  header: { backgroundColor: CORES.azul, paddingHorizontal: 20, paddingVertical: 16, gap: 4 },
  voltar: { color: CORES.amarelo, fontSize: 14, fontWeight: '600' },
  headerTitulo: { fontSize: 20, fontWeight: '700', color: CORES.branco },
  conteudo: { padding: 20, gap: 20 },
  infoRow: { flexDirection: 'row', gap: 8 },
  infoPill: { backgroundColor: CORES.branco, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, elevation: 1 },
  infoPillTexto: { fontSize: 13, color: CORES.textoTitulo, fontWeight: '600' },
  bloco: { backgroundColor: CORES.branco, borderRadius: 16, padding: 16, gap: 8, elevation: 1 },
  blocoTitulo: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: CORES.azul },
  blocoTexto: { fontSize: 14, color: CORES.textoMuted, lineHeight: 22 },
  botao: { backgroundColor: CORES.amarelo, borderRadius: 14, padding: 16, alignItems: 'center' },
  botaoTexto: { fontSize: 15, fontWeight: '700', color: CORES.textoTitulo },
});