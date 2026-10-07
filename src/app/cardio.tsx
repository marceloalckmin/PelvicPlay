import { useLocalSearchParams } from 'expo-router';
import TelaCardio from '../screens/TelaCardio';

export default function CardioRoute() {
  const params = useLocalSearchParams();
  const exercicio = params.exercicioJson ? JSON.parse(params.exercicioJson as string) : null;

  return <TelaCardio exercicio={exercicio} />;
}