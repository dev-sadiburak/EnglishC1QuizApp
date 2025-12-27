import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';



// --- VERİ IMPORTLARI ---
const wordsData = require('./src/data/words.json') as WordItem[];
const sentencesData = require('./src/data/sentences.json') as SentencesData;

export default function App() {
  const [loading, setLoading] = useState<boolean>(true);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestionState | null>(null);
  const [options, setOptions] = useState<WordItem[]>([]);
  const [selectedOption, setSelectedOption] = useState<WordItem | null>(null);
  const [stats, setStats] = useState<StatsState>({ correct: 0, wrong: 0 });
  const [wordStats, setWordStats] = useState<WordStatsMap>({});
  
  // Resim Gösterme State'i
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
      console.error("İstatistik yükleme hatası", e);
    } finally {
      setLoading(false);
    }
  };

  // Loading bittiğinde ilk soruyu sor
  useEffect(() => {
    if (!loading && !currentQuestion) {
      generateNewQuestion();
    }
  }, [loading]);

  // --- AKILLI SORU ALGORİTMASI ---
  const selectSmartWord = (): WordItem => {
    const validWords = wordsData.filter(w => sentencesData[w.word] && sentencesData[w.word].length > 0);

    // %30 ihtimalle rastgele
    if (Math.random() < 0.3) {
       const randomIndex = Math.floor(Math.random() * validWords.length);
       return validWords[randomIndex];
    }

    // %70 ihtimalle zorlandığın kelimeler (Başarı < %60)
    const hardWords = validWords.filter(w => {
      const stat = wordStats[w.word];
      if (!stat) return true; 
      const successRate = stat.total > 0 ? (stat.correct / stat.total) : 0;
      return successRate < 0.60; 
    });

    const pool = hardWords.length > 0 ? hardWords : validWords;
    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  };

  const generateNewQuestion = () => {
    setFeedbackImage(null); 
    setSelectedOption(null);

    let randomWordObj: WordItem;
    
    // Veri hatası varsa döngüde kalmasın diye try-catch
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
        // Eğer seçilen kelimenin cümlesi yoksa (veri hatası), tekrar dene
        generateNewQuestion();
        return;
    }

    const randomSentenceObj = sentencesList[Math.floor(Math.random() * sentencesList.length)];

    // Yanlış şıklar (Aynı türden seçmeye çalış)
    const wrongOptions: WordItem[] = [];
    let loopSafety = 0;

    let candidatePool = wordsData;
    if (targetType) {
        const sameTypeWords = wordsData.filter(w => w.type === targetType && w.word !== wordKey);
        if (sameTypeWords.length >= 4) candidatePool = sameTypeWords;
    }

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

    // Resim Göster
    setFeedbackImage(isCorrect ? 'correct' : 'wrong');

    // Genel İstatistik
    const newStats = {
      correct: isCorrect ? stats.correct + 1 : stats.correct,
      wrong: isCorrect ? stats.wrong : stats.wrong + 1
    };
    setStats(newStats);
    await AsyncStorage.setItem('user_stats', JSON.stringify(newStats));

    // Kelime Bazlı İstatistik
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

  const getButtonColor = (option: WordItem) => {
    if (!selectedOption) return '#fff'; 
    if (option.isCorrect) return '#d4edda'; 
    if (selectedOption === option && !option.isCorrect) return '#f8d7da'; 
    return '#f0f0f0'; 
  };

  if (loading || !currentQuestion) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{marginTop: 10}}>Yükleniyor...</Text>
      </View>
    );
  }

return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* --- KATMAN 1: ARKA PLAN RESMİ --- */}
      {/* Kodda en başa yazdığımız için en altta kalır */}
      {feedbackImage && (
        <Image
          source={
            feedbackImage === 'correct' 
              ? require('./src/assets/correct.png') 
              : require('./src/assets/false.png')
          }
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}

      {/* --- KATMAN 2: İÇERİK --- */}
      {/* Resimden sonra geldiği için onun üzerinde durur */}
      <SafeAreaView style={styles.contentContainer}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.statsText}>Doğru: {stats.correct}</Text>
          <Text style={styles.statsText}>Yanlış: {stats.wrong}</Text>
        </View>

        {/* ... (Geri kalan kodlar aynı) ... */}

        {/* Soru */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>
            {currentQuestion.sentence}
          </Text>
        </View>

        {/* Şıklar */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton, 
                { backgroundColor: getButtonColor(option) }
              ]}
              onPress={() => handleOptionSelect(option)}
              activeOpacity={0.8}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionText}>{option.word}</Text>
                
                {selectedOption && (
                  <View style={styles.metaInfo}>
                      <Text style={styles.meaningText}>({option.tr})</Text>
                      <Text style={[
                          styles.percentText, 
                          { color: parseInt(getSuccessRateText(option.word).slice(1)) > 70 ? '#27ae60' : '#e67e22' }
                      ]}>
                         {getSuccessRateText(option.word)}
                      </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sonraki Butonu */}
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
    backgroundColor: '#F5F7FA', // Eğer resim yoksa bu renk görünür
    // position: 'relative' gerek kalmadı
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, // Ekranı tam kapla
    width: '100%',
    height: '100%',
    opacity: 1, // Silik görünüm
    // zIndex: -1  <-- BUNU SİLDİK, Android'de soruna yol açıyor
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    // Arka plan resmi varsa içerik onun üstünde kalsın diye zIndex verelim (Garanti olsun)
    zIndex: 1, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  questionContainer: {
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  questionText: {
    fontSize: 21,
    fontWeight: '600',
    color: '#2C3E50',
    textAlign: 'center',
    lineHeight: 32,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Hafif transparan buton
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  meaningText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#666',
    marginRight: 8,
  },
  percentText: {
    fontSize: 13,
    fontWeight: 'bold',
    backgroundColor: '#fff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  nextButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 5,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});