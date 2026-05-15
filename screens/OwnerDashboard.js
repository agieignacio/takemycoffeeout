import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, TextInput
} from 'react-native';
import { collection, onSnapshot, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const PIN = '1234';

export default function OwnerDashboard({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [filter, setFilter] = useState('Pending');

  useEffect(() => {
    if (!unlocked) return;
    const unsub = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setOrders(data);
    });
    return unsub;
  }, [unlocked]);

  const handlePin = () => {
    if (pin === PIN) {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPin('');
    }
  };

  const updateStatus = async (id, status) => {
  try {
    const finalStatus = status === 'Done' ? 'completed' : status;
    await updateDoc(doc(db, 'orders', id), { status: finalStatus });

    // Auto-stamp when order is completed
    if (status === 'Done') {
      const order = orders.find(o => o.id === id);
      if (order && order.customerId) {
        const loyaltyRef = doc(db, 'loyalty', order.customerId);
        const loyaltySnap = await getDoc(loyaltyRef);
        const currentStamps = loyaltySnap.exists() ? (loyaltySnap.data().stamps || 0) : 0;

        if (currentStamps < 10) {
          await setDoc(loyaltyRef, { stamps: currentStamps + 1 });
        }
      }
    }
  } catch (e) {
    Alert.alert('Error', 'Failed to update order status.');
    console.error(e);
  }
};

const filteredOrders = orders.filter(o => {
    if (filter === 'All') return true;
    if (filter === 'Done') return o.status === 'completed' || o.status === 'Done';
    return o.status === filter;
  });

  const counts = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Preparing: orders.filter(o => o.status === 'Preparing').length,
    Done: orders.filter(o => o.status === 'completed' || o.status === 'Done').length,
    All: orders.length,
  };

  const counts = {
    Pending: orders.filter(o => o.status === 'Pending').length,
    Preparing: orders.filter(o => o.status === 'Preparing').length,
    Done: orders.filter(o => o.status === 'Done').length,
    All: orders.length,
  };

  // PIN Screen
  if (!unlocked) {
    return (
      <View style={styles.pinContainer}>
        <Text style={styles.pinTitle}>Owner Access</Text>
        <Text style={styles.pinSubtitle}>Enter your PIN to continue</Text>
        <View style={styles.pinBox}>
          <Text style={styles.pinDots}>
            {pin.length > 0 ? '●'.repeat(pin.length) : '○○○○'}
          </Text>
        </View>
        {pinError && <Text style={styles.pinError}>Wrong PIN. Try again!</Text>}
        <View style={styles.pinGrid}>
          {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.pinKey, k === '' && styles.pinKeyEmpty]}
              onPress={() => {
                if (k === '') return;
                if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
                if (pin.length < 4) setPin(p => p + k);
              }}
            >
              <Text style={styles.pinKeyText}>{k}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.pinEnterBtn} onPress={handlePin}>
          <Text style={styles.pinEnterText}>Unlock →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Dashboard Screen
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Owner Dashboard</Text>
          <Text style={styles.headerSub}>Take My Coffee Out</Text>
        </View>
        <TouchableOpacity
          style={styles.manageBtn}
          onPress={() => navigation.navigate('MenuManager')}
        >
          <Text style={styles.manageBtnText}>📦 Menu</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{counts.Pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{counts.Preparing}</Text>
          <Text style={styles.statLabel}>Preparing</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{counts.Done}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{counts.All}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {['Pending', 'Preparing', 'Done', 'All'].map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.ordersList}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {filter} orders 🫙</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.orderCard}>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <View>
                <Text style={styles.orderName}>{item.customerName}</Text>
                <Text style={styles.orderTable}>
                  Table: {item.tableNumber || 'Takeout'}
                </Text>
              </View>
              <View style={[
                styles.statusBadge,
                item.status === 'Pending' && styles.statusPending,
                item.status === 'Preparing' && styles.statusPreparing,
                item.status === 'Done' && styles.statusDone,
              ]}>
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            {/* Order Items */}
            {item.items?.map((i, idx) => (
              <Text key={idx} style={styles.orderItem}>
                • {i.qty}x {i.name} — ₱{i.price * i.qty}
              </Text>
            ))}

            {/* Notes */}
            {item.notes ? (
              <Text style={styles.orderNotes}>📝 {item.notes}</Text>
            ) : null}

            {/* Total */}
            <Text style={styles.orderTotal}>Total: ₱{item.total}</Text>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              {item.status === 'Pending' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionPreparing]}
                  onPress={() => updateStatus(item.id, 'Preparing')}
                >
                  <Text style={styles.actionBtnText}>Start Preparing</Text>
                </TouchableOpacity>
              )}
              {item.status === 'Preparing' && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionDone]}
                  onPress={() => updateStatus(item.id, 'Done')}
                >
                  <Text style={styles.actionBtnText}>Mark as Done ✓</Text>
                </TouchableOpacity>
              )}
              {item.status === 'Done' && (
                <Text style={styles.doneText}>✅ Completed</Text>
              )}
            </View>
          </View>
        )}
      />

      {/* Lock Button */}
      <TouchableOpacity
        style={styles.lockBtn}
        onPress={() => { setUnlocked(false); setPin(''); }}
      >
        <Text style={styles.lockBtnText}>🔒 Lock Dashboard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // PIN Screen
  pinContainer: {
    flex: 1,
    backgroundColor: '#f0ebe0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  pinTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginBottom: 8,
  },
  pinSubtitle: {
    fontSize: 14,
    color: '#8b5a2b',
    marginBottom: 30,
  },
  pinBox: {
    backgroundColor: '#faf7f2',
    borderRadius: 16,
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderWidth: 2,
    borderColor: '#d4c5b0',
    marginBottom: 10,
  },
  pinDots: {
    fontSize: 28,
    color: '#2c1a0e',
    letterSpacing: 12,
  },
  pinError: {
    color: '#c0392b',
    fontSize: 13,
    marginBottom: 10,
  },
  pinGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: 240,
    justifyContent: 'center',
    marginTop: 16,
    gap: 10,
  },
  pinKey: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#faf7f2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#d4c5b0',
  },
  pinKeyEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  pinKeyText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c1a0e',
  },
  pinEnterBtn: {
    backgroundColor: '#5c3317',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 50,
    marginTop: 20,
  },
  pinEnterText: {
    color: '#faf7f2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Dashboard
  container: {
    flex: 1,
    backgroundColor: '#f0ebe0',
  },
  header: {
    backgroundColor: '#2c1a0e',
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#f0ebe0',
  },
  headerSub: {
    fontSize: 12,
    color: '#c87941',
    marginTop: 2,
  },
  manageBtn: {
    backgroundColor: '#5c3317',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  manageBtnText: {
    color: '#faf7f2',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#faf7f2',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c1a0e',
  },
  statLabel: {
    fontSize: 11,
    color: '#8b5a2b',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#faf7f2',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4c5b0',
  },
  filterBtnActive: {
    backgroundColor: '#5c3317',
    borderColor: '#5c3317',
  },
  filterText: {
    fontSize: 12,
    color: '#8b5a2b',
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#faf7f2',
  },
  ordersList: {
    padding: 12,
    paddingBottom: 80,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#8b5a2b',
  },
  orderCard: {
    backgroundColor: '#faf7f2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#2c1a0e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  orderName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c1a0e',
  },
  orderTable: {
    fontSize: 12,
    color: '#8b5a2b',
    marginTop: 2,
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPending: {
    backgroundColor: '#fff3cd',
  },
  statusPreparing: {
    backgroundColor: '#cce5ff',
  },
  statusDone: {
    backgroundColor: '#d4edda',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#2c1a0e',
  },
  orderItem: {
    fontSize: 13,
    color: '#5c3317',
    marginBottom: 3,
  },
  orderNotes: {
    fontSize: 12,
    color: '#8b5a2b',
    fontStyle: 'italic',
    marginTop: 6,
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0d5c5',
    paddingTop: 8,
  },
  actionRow: {
    marginTop: 10,
  },
  actionBtn: {
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionPreparing: {
    backgroundColor: '#5c3317',
  },
  actionDone: {
    backgroundColor: '#2c6e2e',
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  doneText: {
    textAlign: 'center',
    color: '#2c6e2e',
    fontWeight: 'bold',
    fontSize: 14,
  },
  lockBtn: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    backgroundColor: '#2c1a0e',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  lockBtnText: {
    color: '#f0ebe0',
    fontWeight: 'bold',
    fontSize: 15,
  },
});