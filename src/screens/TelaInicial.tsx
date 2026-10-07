import { router } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EXERCICIOS } from '../data/exercicios';
import { CORES } from './theme';

export default function TelaInicial() {
  const categorias = [...new Set(EXERCICIOS.map(e => e.categoria))];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cabecalho}>
        <Text style={styles.eyebrow}>SEUS EXERCÍCIOS</Text>
        <Text style={styles.titulo}>Bom dia! 👋</Text>
      </View>

      <FlatList
        data={categorias}
        keyExtractor={item => item}
        contentContainerStyle={styles.lista}
        renderItem={({ item: categoria }) => (
          <View style={styles.secao}>
            <Text style={styles.categoriaTitulo}>{categoria}</Text>
            {EXERCICIOS.filter(e => e.categoria === categoria).map(exercicio => (
              <TouchableOpacity
                key={exercicio.id}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/exercicio' as any,
                    params: { exercicioJson: JSON.stringify(exercicio) },
                  })
                }
              >
                <View style={styles.cardInfo}>
                  <Text style={styles.cardNome}>{exercicio.nome}</Text>
                  <Text style={styles.cardMeta}>{exercicio.duracaoMin} min</Text>
                </View>
                <Text style={styles.cardSeta}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CORES.fundoClaro },
  cabecalho: {
    backgroundColor: CORES.azul,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2, color: CORES.amarelo },
  titulo: { marginTop: 6, fontSize: 24, fontWeight: '700', color: CORES.branco },
  lista: { padding: 16, gap: 24 },
  secao: { gap: 8 },
  categoriaTitulo: { fontSize: 13, fontWeight: '700', color: CORES.textoMuted, letterSpacing: 0.8, marginBottom: 4 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: CORES.branco,
    borderRadius: 16, padding: 16, elevation: 1,
  },
  cardInfo: { flex: 1 },
  cardNome: { fontSize: 15, fontWeight: '600', color: CORES.textoTitulo },
  cardMeta: { marginTop: 2, fontSize: 12, color: CORES.textoMuted },
  cardSeta: { fontSize: 22, color: CORES.textoMuted },
});