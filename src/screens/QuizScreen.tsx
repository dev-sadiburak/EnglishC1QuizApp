import { Ionicons } from '@expo/vector-icons'; // İkonlar için
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet, Text,
  TouchableOpacity,
  View
} from 'react-native';

import { OptionButton } from '../components/OptionButton';
import { useLanguage } from '../context/LanguageContext';
import { CurrentQuestionState, SentencesData, StatsState, WordItem, WordStatsMap } from '../types';

const wordsData = require('../data/words.json') as WordItem[];
const sentencesData = require('../data/sentences.json') as SentencesData;

export default function QuizScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionState | null>(null);
  const [options, setOptions] = useState<WordItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<WordItem | null>(null);
  const [stats, setStats] = useState<StatsState>({ correct: 0, wrong: 0 });
  const [wordStats, setWordStats] = useState<WordStatsMap>({});
  const [feedbackImage, setFeedbackImage] = useState<'correct' | 'wrong' | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    loadStatsAndStart();
  }, []);

  const loadStatsAndStart = async () => {
    try {
      const storedStats = await AsyncStorage.getItem('user_stats');
      if (storedStats) setStats(JSON.parse(storedStats));

      const storedWordStats = await AsyncStorage.getItem('word_stats');
      if (storedWordStats) setWordStats(JSON.parse(storedWordStats));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !currentQuestion) {
      generateNewQuestion();
    }
  }, [loading]);

  // --- LOGIC (Aynı kalıyor) ---
  const selectSmartWord = (): WordItem => {
    const validWords = wordsData.filter(w => sentencesData[w.word] && sentencesData[w.word].length > 0);

    if (Math.random() < 0.3) {
      return validWords[Math.floor(Math.random() * validWords.length)];
    }

    const hardWords = validWords.filter(w => {
      const stat = wordStats[w.word];
      if (!stat) return true;
      const successRate = stat.total > 0 ? (stat.correct / stat.total) : 0;
      return successRate < 0.60;
    });

    const pool = hardWords.length > 0 ? hardWords : validWords;
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const generateNewQuestion = () => {
    setFeedbackImage(null);
    setSelectedOption(null);

    let randomWordObj: WordItem;
    try {
      randomWordObj = selectSmartWord();
    } catch (e) {
      Alert.alert(t('error'), t('word_select_error'));
      return;
    }

    const wordKey = randomWordObj.word;
    const targetType = randomWordObj.type;
    const sentencesList = sentencesData[wordKey];

    if (!sentencesList || sentencesList.length === 0) {
      generateNewQuestion();
      return;
    }

    const randomSentenceObj = sentencesList[Math.floor(Math.random() * sentencesList.length)];
    const wrongOptions: WordItem[] = [];
    let candidatePool = wordsData;

    if (targetType) {
      const sameTypeWords = wordsData.filter(w => w.type === targetType && w.word !== wordKey);
      if (sameTypeWords.length >= 4) candidatePool = sameTypeWords;
    }

    let loopSafety = 0;
    while (wrongOptions.length < 4 && loopSafety < 200) {
      const randomDistractor = candidatePool[Math.floor(Math.random() * candidatePool.length)];
      const isDuplicate = wrongOptions.some(opt => opt.word === randomDistractor.word);
      if (randomDistractor.word !== wordKey && !isDuplicate) {
        wrongOptions.push(randomDistractor);
      }
      loopSafety++;
    }

    const correctOptionObj: WordItem = { ...randomWordObj, isCorrect: true };
    const allOptions = [...wrongOptions, correctOptionObj].sort(() => Math.random() - 0.5);

    setCurrentQuestion({
      sentence: randomSentenceObj.question,
      answer: randomSentenceObj.answer,
      rootWord: wordKey
    });
    setOptions(allOptions);
  };

  const handleOptionSelect = async (option: WordItem) => {
    if (selectedOption) return;

    setSelectedOption(option);
    const isCorrect = option.isCorrect === true;
    const currentWord = currentQuestion!.rootWord;

    setFeedbackImage(isCorrect ? 'correct' : 'wrong');

    const newStats = {
      correct: isCorrect ? stats.correct + 1 : stats.correct,
      wrong: isCorrect ? stats.wrong : stats.wrong + 1
    };
    setStats(newStats);
    await AsyncStorage.setItem('user_stats', JSON.stringify(newStats));

    const currentStat = wordStats[currentWord] || { correct: 0, total: 0 };
    const newWordStat = {
      correct: isCorrect ? currentStat.correct + 1 : currentStat.correct,
      total: currentStat.total + 1
    };
    const newWordStats = { ...wordStats, [currentWord]: newWordStat };
    setWordStats(newWordStats);
    await AsyncStorage.setItem('word_stats', JSON.stringify(newWordStats));
  };

  const getSuccessRateText = (word: string) => {
    const stat = wordStats[word];
    if (!stat || stat.total === 0) return "%0";
    const percentage = (stat.correct / stat.total) * 100;
    return `%${percentage % 1 === 0 ? percentage : percentage.toFixed(1)}`;
  };

  const renderSentence = () => {
    if (!currentQuestion) return null;
    if (!selectedOption) return <Text style={styles.questionText}>{currentQuestion.sentence}</Text>;

    const parts = currentQuestion.sentence.split('_______');
    return (
      <Text style={styles.questionText}>
        {parts[0]}
        <Text style={[styles.filledAnswer, { color: '#27ae60' }]}>
          {currentQuestion.answer}
        </Text>
        {parts[1]}
      </Text>
    );
  };

  if (loading || !currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Arka Plan Resmi */}
      {feedbackImage && (
        <Image
          source={
            feedbackImage === 'correct'
              ? require('../assets/correct.png')
              : require('../assets/false.png')
          }
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}

      <SafeAreaView style={styles.contentContainer}>

        {/* --- HEADER HUD (Yenilendi) --- */}
        <View style={styles.header}>
          <View style={styles.scoreBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#27ae60" />
            <Text style={styles.scoreText}>{stats.correct}</Text>
          </View>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t('quiz_mode')}</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Ionicons name="close-circle" size={20} color="#e74c3c" />
            <Text style={styles.scoreText}>{stats.wrong}</Text>
          </View>
        </View>

        {/* --- SORU KARTI (Yenilendi) --- */}
        <View style={styles.cardContainer}>
          <View style={styles.cardHeader}>
            <Ionicons name="help-circle-outline" size={18} color="#95a5a6" />
            <Text style={styles.cardLabel}>{t('fill_blank')}</Text>
          </View>
          {renderSentence()}
        </View>

        {/* --- ŞIKLAR --- */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <OptionButton
              key={index}
              option={option}
              isSelected={selectedOption === option}
              isCorrect={option.isCorrect === true}
              isAnswered={!!selectedOption}
              onPress={() => handleOptionSelect(option)}
              successRateText={getSuccessRateText(option.word)}
            />
          ))}
        </View>

        {/* --- NEXT BUTONU --- */}
        {selectedOption && (
          <TouchableOpacity style={styles.nextButton} onPress={generateNewQuestion}>
            <Text style={styles.nextButtonText}>{t('next_question')}</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA', // İstatistik sayfasıyla aynı arka plan
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24, // Sağdan soldan o güzel boşluk (padding)
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // HEADER STYLES
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    marginTop: 10,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 2
  },
  scoreText: {
    fontWeight: '800',
    fontSize: 14,
    color: '#2C3E50',
    marginLeft: 6
  },
  headerTitleContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#95a5a6',
    letterSpacing: 1
  },

  // CARD STYLES
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 20, // Köşeleri daha çok yuvarladık
    padding: 24,
    marginBottom: 30,
    // Modern Gölge Efekti
    shadowColor: '#2C3E50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 180,
    justifyContent: 'center',
  },
  cardHeader: {
    position: 'absolute',
    top: 15,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#95a5a6',
    marginLeft: 5,
    textTransform: 'uppercase'
  },
  questionText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#34495e',
    textAlign: 'center',
    lineHeight: 34
  },
  filledAnswer: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },

  // OPTIONS
  optionsContainer: { flex: 1 },

  // NEXT BUTTON
  nextButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    // Buton gölgesi
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5
  },
});