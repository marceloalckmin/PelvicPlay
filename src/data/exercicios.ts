export type Exercicio = {
  id: string;
  nome: string;
  categoria: string;
  duracaoMin: number;
  descricao: string;
  comoRealizar: string;
  tipo: 'camera' | 'cardio';
};

export const EXERCICIOS: Exercicio[] = [
    {
        id: "ex1",
        nome: "Sapinho Relaxado",
        categoria: "Alongamento",
        duracaoMin: 3,
        descricao: "teste",
        comoRealizar: "agachar parecendo um sapinho (surpreendentemente você não fica relaxado)",
        tipo: 'camera'
    },
    {
        id: "ex2",
        nome: "Abraço de Urso",
        categoria: "Alongamento",
        duracaoMin: 2,
        descricao: "Alongamento para a região superior das costas e ombros.",
        comoRealizar: "Abraçar o próprio corpo o mais forte possível, tentando tocar as escápulas com as pontas dos dedos e segurar.",
        tipo: 'camera'
    },
    {
        id: "ex3",
        nome: "Cachorro Olhando para Baixo",
        categoria: "Fortalecimento",
        duracaoMin: 3,
        descricao: "Postura clássica que alonga a cadeia posterior (pernas e costas) de uma vez só.",
        comoRealizar: "Formar um 'V' invertido com o corpo, empurrando o chão com as mãos e tentando encostar os calcanhares no solo.",
        tipo: 'camera'
    },
    {
        id: "ex4",
        nome: "Flamingo Desengonçado",
        categoria: "Fortalecimento",
        duracaoMin: 2,
        descricao: "Alongamento de quadríceps que também serve para testar o seu equilíbrio caprichoso.",
        comoRealizar: "Ficar em um pé só, puxar o outro pé atrás em direção ao glúteo e tentar não cair nos primeiros 10 segundos.",
        tipo: 'camera'
    },
    {
        id: "ex5",
        nome: "Criança Arrependida",
        categoria: "????",
        duracaoMin: 4,
        descricao: "Postura para relaxar a lombar e os ombros após um dia cansativo.",
        comoRealizar: "Sentar sobre os calcanhares, esticar os braços no chão bem à frente e encostar a testa no tapete simulando um pedido de desculpas ao universo.",
        tipo: 'camera'
    },
    {
        id: "ex6",
        nome: "Bicicleta Ergométrica",
        categoria: "Cardio",
        duracaoMin: 20,
        descricao: "Exercício cardiovascular de baixo impacto, ideal para condicionamento.",
        comoRealizar: "Pedale em ritmo confortável mantendo postura ereta.",
        tipo: 'cardio',
    }

];
