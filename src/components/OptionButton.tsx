// src/components/OptionButton.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WordItem } from '../types'; // Tipleri buradan çekiyoruz

interface Props {
    option: WordItem;
    isSelected: boolean;
    isCorrect: boolean; // Bu şık doğru cevap mı?
    isAnswered: boolean; // Kullanıcı herhangi bir seçim yaptı mı?
    onPress: () => void;
    successRateText: string;
}

export const OptionButton: React.FC<Props> = ({ 
    option, 
    isSelected, 
    isCorrect, 
    isAnswered, 
    onPress,
    successRateText 
}) => {

    // Renk mantığını buraya taşıdık
    const getBackgroundColor = () => {
        if (!isAnswered) return 'rgba(255, 255, 255, 0.85)'; // Normal hali
        if (option.isCorrect) return '#d4edda'; // Doğruysa yeşil
        if (isSelected && !isCorrect) return '#f8d7da'; // Seçilen yanlışsa kırmızı
        return 'rgba(255, 255, 255, 0.85)'; // Diğerleri
    };

    const getSuccessRateColor = () => {
        const rate = parseInt(successRateText.replace('%', ''));
        return rate > 70 ? '#27ae60' : '#e67e22';
    };

    return (
        <TouchableOpacity
            style={[styles.optionButton, { backgroundColor: getBackgroundColor() }]}
            onPress={onPress}
            activeOpacity={0.8}
            disabled={isAnswered} // Cevap verildiyse tıklamayı kapat
        >
            <View style={styles.optionContent}>
                <Text style={styles.optionText}>{option.word}</Text>
                
                {/* Sadece cevap verildiyse detayları göster */}
                {isAnswered && (
                    <View style={styles.metaInfo}>
                        <Text style={styles.meaningText}>({option.tr})</Text>
                        <Text style={[styles.percentText, { color: getSuccessRateColor() }]}>
                            {successRateText}
                        </Text>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    optionButton: {
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E1E8ED',
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
});