// src/screens/QuizScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    SafeAreaView,
    StatusBar,
    StyleSheet, Text,
    TouchableOpacity,
    View
} from 'react-native';

// Importlarımızı yapalım
import { OptionButton } from '../components/OptionButton';
import { CurrentQuestionState, SentencesData, StatsState, WordItem, WordStatsMap } from '../types';

// Verileri require ile çekmeye devam
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

  // --- LOGIC ---
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
        Alert.alert("Hata", "Kelime seçilemedi.");
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
        <View style={styles.header}>
          <Text style={styles.statsText}>Doğru: {stats.correct}</Text>
          <Text style={styles.statsText}>Yanlış: {stats.wrong}</Text>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {!!selectedOption ? currentQuestion.sentence.replace(/_+/g, currentQuestion.answer) : currentQuestion.sentence}
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <OptionButton 
                key={index}
                option={option}
                isSelected={selectedOption === option}
                isCorrect={option.isCorrect === true}
                isAnswered={!!selectedOption} // Çift ünlem boolean'a çevirir
                onPress={() => handleOptionSelect(option)}
                successRateText={getSuccessRateText(option.word)}
            />
          ))}
        </View>

        {selectedOption && (
          <TouchableOpacity style={styles.nextButton} onPress={generateNewQuestion}>
            <Text style={styles.nextButtonText}>Sonraki Soru →</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.15,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    zIndex: 1, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 35, // StatusBar payı
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    elevation: 3,
  },
  statsText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  questionContainer: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
  },
  questionText: { fontSize: 21, fontWeight: '600', color: '#2C3E50', textAlign: 'center', lineHeight: 32 },
  optionsContainer: { flex: 1 },
  nextButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
    elevation: 5,
  },
  nextButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});