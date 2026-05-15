import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, Alert,
  ScrollView
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CUSTOMER_ID = 'customer_001';

export default function CartScreen({ route, navigation }) {
  const cart = route.params?.cart || [];
  const [items, setItems] = useState(cart);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const updateQty = (id, change) => {
    setItems(prev =>
      prev.map(i => i.id === id ? { ...i, qty: Math.max(0, i.qty + change) } : i)
        .filter(i => i.qty > 0)
    );
  };

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const placeOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items first!');
      return;
    }
    if (!customerName.trim()) {
      Alert.alert('Name Required', 'Please enter your name!');
      return;
    }

    setPlacing(true);
    try {
      await addDoc(collection(db, 'orders'), {
        customerId: CUSTOMER_ID,
        customerName: customerName.trim(),
        tableNumber: tableNumber.trim() || 'Takeout',
        notes: notes.trim(),
        items: items.map(i => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
        })),
        total,
        status: 'Pending',
        stamped: false,
        createdAt: serverTimestamp(),
      });

      Alert.alert(
        '✅ Order Placed!',
        `Thank you ${customerName}! Your order is being prepared. ☕`,
        [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to place order. Please try again.');
      console.error(e);
    }
    setPlacing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Order</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {items.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Your cart is empty 🫙</Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.browseText}>Browse Menu →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {items.map(item => (
              <View key={item.id} style={styles.cartItem}>
                <View style={styles.cartItemLeft}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  <Text style={styles.cartItemPrice}>₱{item.price} each</Text>
                </View>
                <View style={styles.qtyControl}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item.id, -1)}
                  >
                    <Text style={styles.qtyBtnText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.qty}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => updateQty(item.id, 1)}
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartItemTotal}>₱{item.price * item.qty}</Text>
              </View>
            ))}

            {/* Total */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₱{total}</Text>
            </View>

            {/* Customer Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name *"
                placeholderTextColor="#a89070"
                value={customerName}
                onChangeText={setCustomerName}
              />
              <TextInput
                style={styles.input}
                placeholder="Table number (or leave blank for takeout)"
                placeholderTextColor="#a89070"
                value={tableNumber}
                onChangeText={setTableNumber}
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Special instructions (optional)"
                placeholderTextColor="#a89070"
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.orderBtn, placing && styles.orderBtnDisabled]}
              onPress={placeOrder}
              disabled={placing}
            >
              <Text style={styles.orderBtnText}>
                {placing ? 'Placing Order...' : `Place Order — ₱${total}`}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0ebe0' },
  header: {
    backgroundColor: '#2c1a0e',
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: 16 },
  backText: { color: '#c87941', fontSize: 16 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#f0ebe0' },
  scroll: { padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 20, color: '#2c1a0e', fontWeight: 'bold' },
  browseText: { fontSize: 16, color: '#5c3317', marginTop: 12, fontWeight: '600' },
  cartItem: {
    backgroundColor: '#faf7f2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cartItemLeft: { flex: 1 },
  cartItemName: { fontSize: 15, fontWeight: 'bold', color: '#2c1a0e' },
  cartItemPrice: { fontSize: 12, color: '#8b5a2b', marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 10 },
  qtyBtn: {
    backgroundColor: '#5c3317',
    width: 28, height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#faf7f2', fontSize: 18, fontWeight: 'bold', lineHeight: 22 },
  qtyText: { fontSize: 16, fontWeight: 'bold', color: '#2c1a0e', marginHorizontal: 10 },
  cartItemTotal: { fontSize: 15, fontWeight: 'bold', color: '#5c3317', minWidth: 50, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2c1a0e',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold', color: '#f0ebe0' },
  totalAmount: { fontSize: 22, fontWeight: 'bold', color: '#c87941' },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#2c1a0e', marginBottom: 10 },
  input: {
    backgroundColor: '#faf7f2',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2c1a0e',
    borderWidth: 1,
    borderColor: '#d4c5b0',
    marginBottom: 10,
  },
  notesInput: { height: 80, textAlignVertical: 'top' },
  orderBtn: {
    backgroundColor: '#5c3317',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  orderBtnDisabled: { backgroundColor: '#a89070' },
  orderBtnText: { color: '#faf7f2', fontSize: 18, fontWeight: 'bold' },
});