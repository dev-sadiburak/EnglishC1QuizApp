import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import {
    Alert, Modal,
    SafeAreaView,
    ScrollView
    // Image importunu kaldırdık, artık gerek yok
    ,




    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

// --- SVG IMPORTLARI ---
// SVG'leri birer bileşen gibi import ediyoruz
import DeFlag from '../assets/flags/de.svg';
import EnFlag from '../assets/flags/en.svg'; // Dosya adının en.svg olduğunu varsayıyorum
import EsFlag from '../assets/flags/es.svg';
import FrFlag from '../assets/flags/fr.svg';
import ItFlag from '../assets/flags/it.svg';
import TrFlag from '../assets/flags/tr.svg';

// --- SVG HARİTASI ---
// Hangi dil kodunun hangi SVG bileşenine denk geldiğini tanımlıyoruz
const FlagComponents: { [key: string]: React.FC<any> } = {
    tr: TrFlag,
    en: EnFlag,
    de: DeFlag,
    fr: FrFlag,
    es: EsFlag,
    it: ItFlag,
};

// --- DİL YAPILANDIRMASI (Artık flag URL'i yok) ---
const LANGUAGES = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
];

export default function SettingsScreen() {
  // ... (Buradaki state ve loadSettings kodları AYNI kalıyor)
  const [settings, setSettings] = useState({
    language: 'tr', soundEnabled: true, hapticEnabled: true, dailyReminder: false,
  });
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => { loadSettings(); }, []);
  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('app_settings');
      if (storedSettings) setSettings(JSON.parse(storedSettings));
    } catch (e) { console.error(e); }
  };
  const saveSetting = async (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await AsyncStorage.setItem('app_settings', JSON.stringify(newSettings));
  };
  const handleReset = () => {
    Alert.alert("Sıfırla", "...", [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sıfırla", style: 'destructive', onPress: async () => { await AsyncStorage.clear(); setSettings({ language: 'tr', soundEnabled: true, hapticEnabled: true, dailyReminder: false }); Alert.alert("Başarılı", "Uygulama sıfırlandı."); } }
      ]
    );
  };

  const SettingItem = ({ icon, title, color, children }: any) => (
    <View style={styles.itemContainer}>
      <View style={styles.itemLeft}>
        <View style={[styles.iconBox, { backgroundColor: color }]}>
          <Ionicons name={icon} size={20} color="#fff" />
        </View>
        <Text style={styles.itemText}>{title}</Text>
      </View>
      <View style={styles.itemRight}>{children}</View>
    </View>
  );

  // --- GÜNCELLENEN LANGUAGE SELECTOR ---
  const LanguageSelector = () => {
    const currentLang = LANGUAGES.find(l => l.code === settings.language) || LANGUAGES[0];
    // Haritadan doğru SVG bileşenini bul
    const FlagIcon = FlagComponents[currentLang.code];
    
    return (
      <TouchableOpacity 
        style={styles.langSelectorButton} 
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {/* Image yerine SVG Bileşenini kullanıyoruz. Genişlik/Yükseklik prop olarak verilir */}
        {FlagIcon && <FlagIcon width={48} height={36} style={styles.flagMargin} />}
        
        <Text style={styles.currentLangName}>{currentLang.name}</Text>
        <Ionicons name="chevron-forward" size={18} color="#bdc3c7" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ayarlar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ... (Diğer ayar bölümleri AYNI kalıyor) ... */}
        <Text style={styles.sectionHeader}>DİL VE BÖLGE</Text>
        <View style={styles.sectionContainer}>
          <SettingItem icon="language" title="Uygulama Dili" color="#3498db">
            <LanguageSelector />
          </SettingItem>
        </View>

        {/* KISALTMA AMACIYLA DİĞER BÖLÜMLERİ GİZLEDİM, ESKİSİ GİBİ KALACAK */}
         <Text style={styles.sectionHeader}>TERCİHLER</Text>
         <View style={styles.sectionContainer}>
            {/* ... switchler ... */}
         </View>
         <Text style={styles.sectionHeader}>VERİ</Text>
         <View style={styles.sectionContainer}>
             {/* ... reset butonu ... */}
         </View>
         <View style={styles.footer}>
            <Text style={styles.versionText}>English Master v1.0.3</Text>
        </View>
      </ScrollView>

      {/* --- GÜNCELLENEN MODAL --- */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dil Seçiniz</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {LANGUAGES.map((lang) => {
                const isSelected = settings.language === lang.code;
                // Döngü içinde doğru SVG'yi bul
                const FlagIconModal = FlagComponents[lang.code];

                return (
                  <TouchableOpacity 
                    key={lang.code} 
                    style={[styles.languageOption, isSelected && styles.languageOptionSelected]}
                    onPress={() => { saveSetting('language', lang.code); setModalVisible(false); }}
                  >
                    <View style={styles.langOptionLeft}>
                        {/* Modal içindeki büyük SVG */}
                        {FlagIconModal && <FlagIconModal width={40} height={30} style={styles.flagMarginLarge} />}
                        
                        <Text style={[styles.modalLangName, isSelected && styles.selectedText]}>
                          {lang.name}
                        </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={24} color="#27ae60" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// --- GÜNCELLENEN STİLLER ---
const styles = StyleSheet.create({
  // ... (Eski stillerin çoğu aynı kalacak)
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#2C3E50' },
  scrollContent: { padding: 20 },
  sectionHeader: { fontSize: 12, fontWeight: '700', color: '#95a5a6', marginBottom: 8, marginTop: 15, marginLeft: 4 },
  sectionContainer: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1 },
  itemContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f7f7f7' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 34, height: 34, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemText: { fontSize: 16, fontWeight: '600', color: '#2c3e50' },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  langSelectorButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  currentLangName: { fontSize: 14, color: '#7f8c8d', marginRight: 6, fontWeight: '500' },
  dangerButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#fff' },
  footer: { alignItems: 'center', marginTop: 30, marginBottom: 50 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, maxHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  closeButton: { padding: 5 },
  languageOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#f7f7f7', borderRadius: 12 },
  languageOptionSelected: { backgroundColor: '#e8f8f5' },
  langOptionLeft: { flexDirection: 'row', alignItems: 'center' },
  modalLangName: { fontSize: 18, color: '#333', fontWeight: '500' },
  selectedText: { color: '#27ae60', fontWeight: 'bold' },

  // --- YENİ SVG STİLLERİ ---
  // SVG bileşenlerine style ile sadece margin veriyoruz, boyutları prop olarak verdik.
  flagMargin: {
    marginRight: 8,
    borderRadius: 3, // SVG'lerde borderRadius bazen çalışmaz ama deneyelim, çalışmazsa View içine almak gerekir.
    overflow: 'hidden'
  },
  flagMarginLarge: {
    marginRight: 15,
    borderRadius: 4,
    overflow: 'hidden'
  }
});