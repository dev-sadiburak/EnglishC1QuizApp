import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Dimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useLanguage } from '../context/LanguageContext';
import { StatsState, WordStatsMap } from '../types';

const { width } = Dimensions.get('window');

export default function StatsScreen() {
  const [wordStats, setWordStats] = useState<WordStatsMap>({});
  const [generalStats, setGeneralStats] = useState<StatsState>({ correct: 0, wrong: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'weak' | 'strong'>('weak'); // Tab State'i
  const { t } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const storedWordStats = await AsyncStorage.getItem('word_stats');
      const storedGenStats = await AsyncStorage.getItem('user_stats');

      if (storedWordStats) setWordStats(JSON.parse(storedWordStats));
      if (storedGenStats) setGeneralStats(JSON.parse(storedGenStats));
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
  };

  // --- ANALİTİK HESAPLAMALAR ---
  const analyzeData = () => {
    const rawData = Object.entries(wordStats).map(([word, stat]) => ({
      word,
      correct: stat.correct,
      total: stat.total,
      rate: stat.total > 0 ? (stat.correct / stat.total) * 100 : 0
    }));

    // 1. Dağılım (Distribution)
    const redZone = rawData.filter(w => w.rate < 60).length;
    const yellowZone = rawData.filter(w => w.rate >= 60 && w.rate < 85).length;
    const greenZone = rawData.filter(w => w.rate >= 85).length;
    const totalCount = rawData.length || 1; // Sıfıra bölünme hatası olmasın

    // 2. Listeler
    // Zayıflar: Başarısı %60 altı olanlar
    const weakList = rawData
      .filter(w => w.rate < 60)
      .sort((a, b) => a.rate - b.rate); // En kötü en üstte

    // Güçlüler: Başarısı %85 üzeri VE En az 3 kere çözülmüş (Confidence Interval mantığı)
    const strongList = rawData
      .filter(w => w.rate >= 85 && w.total >= 3)
      .sort((a, b) => b.total - a.total); // En çok çözülen en üstte (Tecrübe)

    return {
      weakList,
      strongList,
      distribution: {
        red: (redZone / totalCount) * 100,
        yellow: (yellowZone / totalCount) * 100,
        green: (greenZone / totalCount) * 100
      },
      totalCount
    };
  };

  const { weakList, strongList, distribution, totalCount } = analyzeData();

  // Listeyi Tab'a göre seç
  const currentList = activeTab === 'weak' ? weakList : strongList;
  const generalAccuracy = (generalStats.correct + generalStats.wrong) > 0
    ? Math.round((generalStats.correct / (generalStats.correct + generalStats.wrong)) * 100)
    : 0;


  // --- BİLEŞENLER ---

  // Distribution Bar (Veri Görselleştirme)
  const DistributionBar = () => (
    <View style={styles.distContainer}>
      <Text style={styles.distTitle}>{t('data_distribution', { count: totalCount })}</Text>
      <View style={styles.distBarTrack}>
        <View style={{ ...styles.distSegment, backgroundColor: '#e74c3c', width: `${distribution.red}%` }} />
        <View style={{ ...styles.distSegment, backgroundColor: '#f1c40f', width: `${distribution.yellow}%` }} />
        <View style={{ ...styles.distSegment, backgroundColor: '#27ae60', width: `${distribution.green}%` }} />
      </View>
      <View style={styles.distLegend}>
        <Text style={styles.legendText}><View style={[styles.dot, { backgroundColor: '#e74c3c' }]} /> {t('critical_zone', { rate: distribution.red.toFixed(0) })}</Text>
        <Text style={styles.legendText}><View style={[styles.dot, { backgroundColor: '#f1c40f' }]} /> {t('developing_zone', { rate: distribution.yellow.toFixed(0) })}</Text>
        <Text style={styles.legendText}><View style={[styles.dot, { backgroundColor: '#27ae60' }]} /> {t('mastered_zone', { rate: distribution.green.toFixed(0) })}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('data_analysis')}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('general_accuracy', { rate: generalAccuracy })}</Text>
        </View>
      </View>

      <FlatList
        data={currentList}
        keyExtractor={item => item.word}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListHeaderComponent={
          <>
            {/* Üst Kısım: Dağılım Grafiği */}
            <DistributionBar />

            {/* Tab Seçici (Segmented Control) */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'weak' && styles.activeTabRed]}
                onPress={() => setActiveTab('weak')}
              >
                <Ionicons name="alert-circle" size={18} color={activeTab === 'weak' ? '#fff' : '#e74c3c'} />
                <Text style={[styles.tabText, activeTab === 'weak' && styles.activeTabText]}>
                  {t('critical_tab', { count: weakList.length })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'strong' && styles.activeTabGreen]}
                onPress={() => setActiveTab('strong')}
              >
                <Ionicons name="shield-checkmark" size={18} color={activeTab === 'strong' ? '#fff' : '#27ae60'} />
                <Text style={[styles.tabText, activeTab === 'strong' && styles.activeTabText]}>
                  {t('mastered_tab', { count: strongList.length })}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {activeTab === 'weak' ? t('empty_weak') : t('empty_strong')}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.wordRow}>
            <View style={styles.wordInfo}>
              <Text style={styles.wordText}>{item.word}</Text>
              {/* Detaylı Mühendis Verisi: 3/5 gibi net rakamlar */}
              <Text style={styles.statDetail}>
                {t('stats_detail', { correct: item.correct, total: item.total })}
              </Text>
            </View>

            <View style={styles.rateBadgeContainer}>
              <Text style={[
                styles.rateBig,
                { color: activeTab === 'weak' ? '#e74c3c' : '#27ae60' }
              ]}>
                %{item.rate.toFixed(0)}
              </Text>
            </View>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#2C3E50' },
  badge: { backgroundColor: '#E8F6F3', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  badgeText: { color: '#16A085', fontWeight: 'bold', fontSize: 12 },

  // Dağılım Barı
  distContainer: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 12, elevation: 2 },
  distTitle: { fontSize: 14, color: '#7f8c8d', marginBottom: 10, fontWeight: '600' },
  distBarTrack: { flexDirection: 'row', height: 12, borderRadius: 6, overflow: 'hidden', backgroundColor: '#ecf0f1' },
  distSegment: { height: '100%' },
  distLegend: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  legendText: { fontSize: 11, color: '#555' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 }, // Inline style fix for View inside Text issue logic

  // Tablar
  tabContainer: { flexDirection: 'row', marginHorizontal: 15, marginBottom: 10, backgroundColor: '#e5e5e5', borderRadius: 10, padding: 4 },
  tabButton: { flex: 1, flexDirection: 'row', paddingVertical: 10, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  activeTabRed: { backgroundColor: '#e74c3c' },
  activeTabGreen: { backgroundColor: '#27ae60' },
  tabText: { marginLeft: 8, fontWeight: '600', color: '#7f8c8d' },
  activeTabText: { color: '#fff' },

  // Liste Elemanları
  wordRow: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 15,
    marginBottom: 8,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 3, elevation: 1
  },
  wordInfo: { flex: 1 },
  wordText: { fontSize: 17, fontWeight: '700', color: '#34495e' },
  statDetail: { fontSize: 13, color: '#95a5a6', marginTop: 2 },
  rateBadgeContainer: { alignItems: 'flex-end' },
  rateBig: { fontSize: 18, fontWeight: 'bold' },

  emptyState: { alignItems: 'center', marginTop: 30 },
  emptyText: { color: '#95a5a6', fontSize: 16 },
});