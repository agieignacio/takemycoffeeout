import { useState } from 'react';
import {
  View, Text, StyleSheet,
  TouchableOpacity, Alert,
  ScrollView, TextInput
} from 'react-native';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

const CUSTOMER_ID = 'customer_001';

export default function CartScreen({ route, navigation }) {
  const [items, setItems] = useState(route.params?.cart || []);
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [placing, setPlacing] = useState(false);

  const onCartUpdate = route.params?.onCartUpdate;

  const syncCart = (updatedItems) => {
    setItems(updatedItems);
    if (onCartUpdate) onCartUpdate(updatedItems);
  };

  const updateQty = (cartKey, change) => {
    const updated = items
      .map(i => i.cartKey === cartKey ? { ...i, qty: Math.max(0, i.qty + change) } : i)
      .filter(i => i.qty > 0);
    syncCart(updated);
  };

  const removeItem = (cartKey) => {
    Alert.alert(
      'Remove Item',
      'Remove this item from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = items.filter(i => i.cartKey !== cartKey);
            syncCart(updated);
          }
        }
      ]
    );
  };

  const clearCart = () => {
    Alert.alert(
      'Clear Cart',
      'Remove all items from cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: () => syncCart([])
        }
      ]
    );
  };

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalItems = items.reduce((sum, i) => sum + i.qty, 0);

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
          size: i.size || null,
          temp: i.temp || null,
        })),
        total,
        status: 'Pending',
        stamped: false,
        createdAt: serverTimestamp(),
      });
      syncCart([]);
      Alert.alert(
        '✅ Order Placed!',
        `Thank you ${customerName}! Your order is being prepared. ☕`,
        [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to place order.');
      console.error(e);
    }
    setPlacing(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Your Order {totalItems > 0 ? `(${totalItems})` : ''}
        </Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={clearCart}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
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
              <View key={item.cartKey} style={styles.cartItem}>
                <View style={styles.cartItemLeft}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  {(item.size || item.temp) && (
                    <Text style={styles.cartItemSub}>
                      {[item.size, item.temp].filter(Boolean).join(' · ')}
                    </Text>
                  )}
                  <Text style={styles.cartItemPrice}>₱{item.price} each</Text>
                </View>
                <View style={styles.cartItemRight}>
                  <View style={styles.qtyControl}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQty(item.cartKey, -1)}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.qty}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQty(item.cartKey, 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemTotal}>₱{item.price * item.qty}</Text>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeItem(item.cartKey)}
                  >
                    <Text style={styles.removeBtnText}>🗑️ Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>₱{total}</Text>
            </View>

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
                placeholder="Table number (leave blank for takeout)"
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
    justifyContent: 'space-between',
  },
  backText: { color: '#c87941', fontSize: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#f0ebe0' },
  clearText: { color: '#ff6b6b', fontSize: 14, fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyText: { fontSize: 20, color: '#2c1a0e', fontWeight: 'bold' },
  browseText: { fontSize: 16, color: '#5c3317', marginTop: 12, fontWeight: '600' },
  cartItem: {
    backgroundColor: '#faf7f2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#2c1a0e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cartItemLeft: { flex: 1, marginRight: 10 },
  cartItemName: { fontSize: 15, fontWeight: 'bold', color: '#2c1a0e' },
  cartItemSub: { fontSize: 12, color: '#8b5a2b', marginTop: 2, fontStyle: 'italic' },
  cartItemPrice: { fontSize: 12, color: '#a89070', marginTop: 4 },
  cartItemRight: { alignItems: 'flex-end', gap: 6 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: {
    backgroundColor: '#5c3317',
    width: 28, height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnText: { color: '#faf7f2', fontSize: 18, fontWeight: 'bold', lineHeight: 22 },
  qtyText: { fontSize: 16, fontWeight: 'bold', color: '#2c1a0e', minWidth: 20, textAlign: 'center' },
  cartItemTotal: { fontSize: 15, fontWeight: 'bold', color: '#5c3317' },
  removeBtn: {
    backgroundColor: '#fde8e8',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeBtnText: { fontSize: 12, color: '#c0392b', fontWeight: '600' },
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