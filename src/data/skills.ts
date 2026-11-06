/**
 * Logos live in public/assets/logos.svg (Simple Icons and Devicon). A technology with no
 * available mark uses a lettered tile via `mono`; don't hand-draw logos.
 * Items past the first three in a group, and groups past the first three, sit behind Show more.
 */
export type Tech = { name: string; brand: string; icon?: string; mono?: string };
export type SkillGroup = { key: 'languages' | 'ai' | 'data' | 'apps' | 'devops' | 'viz'; path: string; items: Tech[] };

const INK = '#0D1B2A';

export const SKILL_GROUPS: SkillGroup[] = [
  {
    key: 'languages',
    path: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
    items: [
      { name: 'Python', brand: '#3776AB', icon: 'python' },
      { name: 'SQL / PLSQL', brand: INK, mono: 'SQL' },
      { name: 'C++', brand: '#00599C', icon: 'cplusplus' },
      { name: 'C', brand: '#A8B9CC', icon: 'c' },
      { name: 'Java', brand: '#000000', icon: 'openjdk' },
      { name: 'JEE', brand: INK, mono: 'JEE' },
      { name: 'JavaScript', brand: '#F7DF1E', icon: 'javascript' },
      { name: 'Bash', brand: '#4EAA25', icon: 'gnubash' },
      { name: 'R', brand: '#276DC3', icon: 'r' },
      { name: 'Go', brand: '#00ADD8', icon: 'go' },
      { name: 'Solidity', brand: '#363636', icon: 'solidity' },
      { name: 'SWI-Prolog', brand: INK, icon: 'prolog' },
    ],
  },
  {
    key: 'ai',
    path: 'M5 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M5 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M19 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M12 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0-4 0M7 7.500l3-2M7 16.500l3 2M7 8l3 10M7 16L10 6M14 5.500l3.300 5M14 18.500l3.300-5',
    items: [
      { name: 'PyTorch', brand: '#EE4C2C', icon: 'pytorch' },
      { name: 'Hugging Face', brand: '#FFD21E', icon: 'huggingface' },
      { name: 'LangChain', brand: '#1C3C3C', icon: 'langchain' },
      { name: 'scikit-learn', brand: '#F7931E', icon: 'scikitlearn' },
      { name: 'Ollama', brand: '#000000', icon: 'ollama' },
      { name: 'Gemma', brand: INK, mono: 'Ge' },
      { name: 'XGBoost', brand: INK, mono: 'XG' },
      { name: 'Pandas', brand: '#150458', icon: 'pandas' },
      { name: 'NumPy', brand: '#013243', icon: 'numpy' },
      { name: 'JAX', brand: INK, mono: 'JAX' },
    ],
  },
  {
    key: 'data',
    path: 'M12 2.500c-4.400 0-8 1.300-8 3v13c0 1.700 3.600 3 8 3s8-1.300 8-3v-13c0-1.700-3.600-3-8-3zM4 5.500c0 1.700 3.600 3 8 3s8-1.300 8-3M4 12c0 1.700 3.600 3 8 3s8-1.300 8-3',
    items: [
      { name: 'Kafka', brand: '#231F20', icon: 'apachekafka' },
      { name: 'Airflow', brand: '#017CEE', icon: 'apacheairflow' },
      { name: 'Snowflake', brand: '#29B5E8', icon: 'snowflake' },
      { name: 'dbt', brand: INK, mono: 'dbt' },
      { name: 'Debezium', brand: INK, mono: 'Dz' },
      { name: 'ZooKeeper', brand: INK, mono: 'ZK' },
      { name: 'Faust', brand: INK, mono: 'Fa' },
      { name: 'MinIO', brand: '#C72E49', icon: 'minio' },
      { name: 'PostgreSQL', brand: '#4169E1', icon: 'postgresql' },
      { name: 'MySQL', brand: '#4479A1', icon: 'mysql' },
      { name: 'Spark', brand: '#E25A1C', icon: 'apachespark' },
      { name: 'BigQuery', brand: '#669DF6', icon: 'googlebigquery' },
    ],
  },
  {
    key: 'apps',
    path: 'M5.500 4h13A2.500 2.500 0 0 1 21 6.500v11a2.500 2.500 0 0 1-2.500 2.500h-13A2.500 2.500 0 0 1 3 17.500v-11A2.500 2.500 0 0 1 5.500 4zM3 9h18M7 6.500h.01M10 6.500h.01',
    items: [
      { name: 'FastAPI', brand: '#009688', icon: 'fastapi' },
      { name: 'Next.js', brand: '#000000', icon: 'nextdotjs' },
      { name: 'React', brand: '#61DAFB', icon: 'react' },
      { name: 'Streamlit', brand: '#FF4B4B', icon: 'streamlit' },
      { name: 'Gradio', brand: '#F97316', icon: 'gradio' },
      { name: 'Hibernate', brand: '#59666C', icon: 'hibernate' },
      { name: 'Maven', brand: '#C71A36', icon: 'apachemaven' },
    ],
  },
  {
    key: 'devops',
    path: 'M20 12a8 8 0 0 1-14 5.300M4 12a8 8 0 0 1 14-5.300M18 3v4h-4M6 21v-4h4',
    items: [
      { name: 'Docker', brand: '#2496ED', icon: 'docker' },
      { name: 'Kubernetes', brand: '#326CE5', icon: 'kubernetes' },
      { name: 'MLflow', brand: '#0194E2', icon: 'mlflow' },
      { name: 'Git', brand: '#F03C2E', icon: 'git' },
      { name: 'GitHub', brand: '#181717', icon: 'github' },
      { name: 'Amazon S3', brand: INK, icon: 'amazonwebservices' },
      { name: 'Oracle Cloud', brand: INK, icon: 'oracle' },
    ],
  },
  {
    key: 'viz',
    path: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
    items: [
      { name: 'Power BI', brand: INK, mono: 'BI' },
      { name: 'Plotly', brand: '#7A76FF', icon: 'plotly' },
      { name: 'Matplotlib', brand: INK, icon: 'matplotlib' },
      { name: 'Seaborn', brand: INK, mono: 'Sb' },
    ],
  },
];

export const METHODS_ICON = 'M9 3h6M10 3v6l-5.500 9.500A1.700 1.700 0 0 0 6 21h12a1.700 1.700 0 0 0 1.500-2.500L14 9V3M7.500 15h9';
