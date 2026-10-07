import { useLocalSearchParams } from 'expo-router';
import TelaCamera from '../screens/TelaCamera';

export default function CameraRoute() {
  const params = useLocalSearchParams();
  const exercicio = params.exercicioJson ? JSON.parse(params.exercicioJson as string) : null;

  return <TelaCamera exercicio={exercicio} />;
}