import { Question } from '@/app/types';

export interface TopicRule {
  topic: string;
  /** Palavras-chave já normalizadas (minúsculas, sem acentos). */
  keywords: string[];
}

export const DEFAULT_TOPIC: Record<Question['discipline'], string> = {
  matematica: 'Matemática: Geral',
  'ciencias-natureza': 'Ciências da Natureza: Geral',
  'ciencias-humanas': 'Ciências Humanas: Geral',
  linguagens: 'Interpretação de Texto',
};

export const FOREIGN_LANGUAGE_TOPIC = 'Língua Estrangeira';

export const TOPIC_RULES: Record<Question['discipline'], TopicRule[]> = {
  matematica: [
    { topic: 'Matemática: Funções', keywords: ['funcao', 'f(x)', 'grafico da funcao', 'parabola', 'logaritmo', 'exponencial', 'dominio'] },
    { topic: 'Matemática: Geometria Plana', keywords: ['area', 'perimetro', 'triangulo', 'circulo', 'retangulo', 'quadrado', 'losango', 'trapezio', 'circunferencia'] },
    { topic: 'Matemática: Geometria Espacial', keywords: ['volume', 'cilindro', 'cone', 'esfera', 'prisma', 'piramide', 'cubo', 'capacidade'] },
    { topic: 'Matemática: Estatística', keywords: ['media', 'mediana', 'moda', 'desvio padrao', 'variancia', 'estatistic', 'frequencia', 'histograma'] },
    { topic: 'Matemática: Probabilidade', keywords: ['probabilidade', 'sorteio', 'sorteado', 'chance', 'aleatoria', 'espaco amostral'] },
    { topic: 'Matemática: Análise Combinatória', keywords: ['combinac', 'arranjo', 'permutac', 'de quantas maneiras', 'anagrama', 'senhas', 'principio multiplicativo'] },
    { topic: 'Matemática: Razão, Proporção e Porcentagem', keywords: ['razao', 'proporcao', 'regra de tres', 'escala', 'porcentagem', 'percentual', 'desconto', 'juros', 'acrescimo'] },
    { topic: 'Matemática: Progressões', keywords: ['progressao', 'termo geral', 'sequencia'] },
    { topic: 'Matemática: Trigonometria', keywords: ['seno', 'cosseno', 'tangente', 'trigonometr', 'angulo de elevacao'] },
    { topic: 'Matemática: Geometria Analítica', keywords: ['plano cartesiano', 'coordenadas', 'equacao da reta', 'ponto medio'] },
    { topic: 'Matemática: Equações e Sistemas', keywords: ['equacao', 'sistema de equacoes', 'raiz', 'incognita', 'inequacao'] },
  ],
  'ciencias-natureza': [
    { topic: 'Física: Mecânica', keywords: ['velocidade', 'aceleracao', 'forca', 'newton', 'energia cinetica', 'energia potencial', 'potencia', 'trabalho', 'atrito', 'movimento', 'impulso'] },
    { topic: 'Física: Eletricidade', keywords: ['corrente eletrica', 'resistor', 'resistencia eletrica', 'tensao', 'circuito', 'campo eletrico', 'carga eletrica', 'eletrica', 'bateria'] },
    { topic: 'Física: Ondas e Óptica', keywords: ['onda', 'frequencia', 'som', 'luz', 'refracao', 'reflexao', 'lente', 'espelho', 'radiacao'] },
    { topic: 'Física: Termologia', keywords: ['calor', 'temperatura', 'termic', 'dilatacao', 'calorimetria', 'gas ideal'] },
    { topic: 'Química: Orgânica', keywords: ['organic', 'carbono', 'hidrocarboneto', 'polimero', 'etanol', 'combustivel', 'isomeria', 'ester', 'alcool'] },
    { topic: 'Química: Soluções e Reações', keywords: ['solucao', 'concentracao', 'mol', 'reacao', 'ph', 'acido', 'base', 'oxidacao', 'equilibrio', 'estequiometr', 'eletroquimica', 'pilha'] },
    { topic: 'Biologia: Ecologia', keywords: ['ecossistema', 'cadeia alimentar', 'ecolog', 'biodiversidade', 'poluicao', 'bioma', 'ambiental', 'sustentabilidade', 'desmatamento'] },
    { topic: 'Biologia: Genética', keywords: ['gene', 'dna', 'hereditari', 'mutacao', 'cromossomo', 'alelo', 'genetic', 'transgenic'] },
    { topic: 'Biologia: Fisiologia e Saúde', keywords: ['doenca', 'vacina', 'virus', 'bacteria', 'saude', 'hormonio', 'imunolog', 'celula', 'parasita'] },
    { topic: 'Biologia: Evolução', keywords: ['evolucao', 'selecao natural', 'especie', 'adaptacao', 'ancestral'] },
  ],
  'ciencias-humanas': [
    { topic: 'História do Brasil', keywords: ['colonia', 'imperio', 'republica', 'escravidao', 'ditadura', 'vargas', 'colonial', 'bandeirantes', 'abolicao', 'getulio'] },
    { topic: 'História Geral', keywords: ['revolucao francesa', 'guerra mundial', 'idade media', 'feudal', 'revolucao industrial', 'grecia', 'roma', 'nazismo', 'fascismo', 'guerra fria', 'iluminismo', 'antiguidade'] },
    { topic: 'Geografia Física', keywords: ['clima', 'relevo', 'bioma', 'hidrograf', 'solo', 'vegetacao', 'bacia', 'erosao', 'cartograf'] },
    { topic: 'Geografia Humana', keywords: ['urbaniza', 'migracao', 'populacao', 'globalizacao', 'industrializacao', 'agricultura', 'agrario', 'territorio', 'geopolitic', 'demograf'] },
    { topic: 'Filosofia', keywords: ['filosof', 'etica', 'platao', 'aristoteles', 'kant', 'descartes', 'nietzsche', 'socrates', 'moral'] },
    { topic: 'Sociologia', keywords: ['sociolog', 'cidadania', 'desigualdade', 'cultura', 'movimento social', 'estado', 'politic', 'direitos', 'democracia', 'trabalho'] },
  ],
  linguagens: [
    { topic: 'Gramática e Língua Portuguesa', keywords: ['norma culta', 'concordancia', 'pontuacao', 'coesao', 'verbal', 'regencia', 'variacao linguistica', 'oracao', 'pronome', 'crase'] },
    { topic: 'Literatura', keywords: ['modernismo', 'romantismo', 'barroco', 'realismo', 'poema', 'poeta', 'romance', 'parnasian', 'simbolismo', 'naturalismo', 'verso'] },
    { topic: 'Artes e Cultura', keywords: ['pintura', 'musica', 'danca', 'teatro', 'cinema', 'escultura', 'arte', 'fotografia'] },
    { topic: 'Tecnologias da Comunicação', keywords: ['internet', 'rede social', 'redes sociais', 'digital', 'tecnologia', 'midia', 'publicidade'] },
  ],
};
