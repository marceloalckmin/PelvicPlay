import { useLocalSearchParams } from 'expo-router';
import TelaExercicio from '../screens/TelaExercicio';

export default function ExercicioRoute() {
  const params = useLocalSearchParams();
  const exercicio = params.exercicioJson ? JSON.parse(params.exercicioJson as string) : null;

  return <TelaExercicio exercicio={exercicio} />;
}