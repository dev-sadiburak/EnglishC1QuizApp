// src/types/index.ts

export interface WordItem {
    word: string;
    tr: string;
    type?: string; 
    level?: string;
    isCorrect?: boolean;
}
  
export interface QuizItem {
    question: string;
    answer: string;
    pos: string;
}
  
export interface SentencesData {
    [key: string]: QuizItem[];
}
  
export interface CurrentQuestionState {
    sentence: string;
    answer: string;
    rootWord: string;
}
  
export interface WordStat {
    correct: number;
    total: number;
}
  
export interface WordStatsMap {
    [word: string]: WordStat;
}
  
export interface StatsState {
    correct: number;
    wrong: number;
}