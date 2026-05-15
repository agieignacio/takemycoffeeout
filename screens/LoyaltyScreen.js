import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const TOTAL_STAMPS = 10;
const CUSTOMER_ID = 'customer_001';

export default function LoyaltyScreen() {
  const [stamps, setStamps] = useState(0);
  const [totalRedeemed, setTotalRedeemed] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    const loyaltyRef = doc(db, 'loyalty', CUSTOMER_ID);
    const unsub = onSnapshot(loyaltyRef, async (snap) => {
      if (snap.exists()) {
        setStamps(snap.data().stamps || 0);
        setTotalRedeemed(snap.data().totalRedeemed || 0);
      } else {
        await setDoc(loyaltyRef, { stamps: 0, totalRedeemed: 0 });
        setStamps(0);
        setTotalRedeemed(0);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const redeemCard = async () => {
    if (stamps < TOTAL_STAMPS) {
      Alert.alert('Not yet!', `You need ${TOTAL_STAMPS - stamps} more stamp(s) to redeem.`);
      return;
    }
    Alert.alert(
      '☕ Redeem Free Drink?',
      'Show this screen to the cashier, then tap Redeem to reset your card.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem!',
          onPress: async () => {
            setRedeeming(true);
            try {
              const loyaltyRef = doc(db, 'loyalty', CUSTOMER_ID);
              await setDoc(loyaltyRef, {
                stamps: 0,
                totalRedeemed: totalRedeemed + 1,
              });
              Alert.alert('✅ Redeemed!', 'Enjoy your free drink! Card has been reset. ☕');
            } catch (e) {
              Alert.alert('Error', 'Could not redeem. Try again.');
            } finally {
              setRedeeming(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#5c3317" />
        <Text style={styles.loadingText}>Loading your card...</Text>
      </View>
    );
  }

  const isComplete = stamps >= TOTAL_STAMPS;
  const progress = Math.min(stamps / TOTAL_STAMPS, 1);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Loyalty Card</Text>
        <Text style={styles.headerSub}>Take My Coffee Out ☕</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>☕ Stamp Card</Text>
        <Text style={styles.cardSubtitle}>
          Collect {TOTAL_STAMPS} stamps for a FREE drink!
        </Text>

        {/* Stamps Grid */}
        <View style={styles.stampsGrid}>
          {Array.from({ length: TOTAL_STAMPS }).map((_, i) => (
            <View
              key={i}
              style={[styles.stamp, i < stamps && styles.stampFilled]}
            >
              <Text style={styles.stampEmoji}>
                {i < stamps ? '☕' : '○'}
              </Text>
            </View>
          ))}
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>
          {isComplete
            ? '🎉 Ready to redeem!'
            : `${stamps}/${TOTAL_STAMPS} — ${TOTAL_STAMPS - stamps} more to go!`}
        </Text>
      </View>

      {/* Free drink banner */}
      {isComplete && (
        <View style={styles.rewardBanner}>
          <Text style={styles.rewardText}>🥳 FREE DRINK UNLOCKED!</Text>
          <Text style={styles.rewardSub}>Show this screen to the cashier</Text>
        </View>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stamps}</Text>
          <Text style={styles.statLabel}>Current Stamps</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{totalRedeemed}</Text>
          <Text style={styles.statLabel}>Free Drinks Earned</Text>
        </View>
      </View>

      {/* How it works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>How it works</Text>
        <Text style={styles.howStep}>1️⃣  Order any drink from our menu</Text>
        <Text style={styles.howStep}>2️⃣  Owner marks your order as Done</Text>
        <Text style={styles.howStep}>3️⃣  Stamp is added automatically! ✨</Text>
        <Text style={styles.howStep}>4️⃣  Collect {TOTAL_STAMPS} stamps → FREE drink ☕</Text>
      </View>

      {/* Redeem Button */}
      {isComplete && (
        <TouchableOpacity
          style={[styles.redeemBtn, redeeming && styles.btnDisabled]}
          onPress={redeemCard}
          disabled={redeeming}
        >
          <Text style={styles.redeemBtnText}>
            {redeeming ? 'Redeeming...' : '☕ Redeem Free Drink'}
          </Text>
        </TouchableOpacity>
      )}

      <Text style={styles.note}>
        Stamps are added automatically every time your order is completed. ✅
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0ebe0',
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    backgroundColor: '#f0ebe0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#5c3317',
    fontSize: 14,
  },
  header: {
    backgroundColor: '#2c1a0e',
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#f0ebe0',
  },
  headerSub: {
    fontSize: 13,
    color: '#c87941',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#faf7f2',
    margin: 16,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#2c1a0e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#e0d5c5',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8b5a2b',
    marginBottom: 20,
    textAlign: 'center',
  },
  stampsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 20,
  },
  stamp: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#f0ebe0',
    borderWidth: 2,
    borderColor: '#d4c5b0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampFilled: {
    backgroundColor: '#5c3317',
    borderColor: '#5c3317',
  },
  stampEmoji: {
    fontSize: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0d5c5',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#c87941',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: '#8b5a2b',
    textAlign: 'center',
    fontWeight: '600',
  },
  rewardBanner: {
    backgroundColor: '#5c3317',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  rewardText: {
    color: '#faf7f2',
    fontSize: 20,
    fontWeight: 'bold',
  },
  rewardSub: {
    color: '#c87941',
    fontSize: 13,
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#faf7f2',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#2c1a0e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c1a0e',
  },
  statLabel: {
    fontSize: 12,
    color: '#8b5a2b',
    marginTop: 4,
    textAlign: 'center',
  },
  howItWorks: {
    backgroundColor: '#faf7f2',
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  howTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginBottom: 10,
  },
  howStep: {
    fontSize: 13,
    color: '#5c3317',
    marginBottom: 6,
    lineHeight: 20,
  },
  redeemBtn: {
    backgroundColor: '#5c3317',
    marginHorizontal: 16,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#2c1a0e',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  redeemBtnText: {
    color: '#faf7f2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  btnDisabled: {
    opacity: 0.4,
  },
  note: {
    fontSize: 12,
    color: '#a89070',
    textAlign: 'center',
    marginHorizontal: 20,
    marginTop: 8,
  },
});