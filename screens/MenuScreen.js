import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIES = ['All', 'Coffee', 'Non-Coffee', 'Food', 'Pastry'];

export default function MenuScreen({ navigation }) {
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenuItems(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  const filtered = category === 'All'
    ? menuItems
    : menuItems.filter(i => i.category === category);

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(c => c.id === item.id);
      if (exists) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const getQty = (id) => {
    const found = cart.find(c => c.id === id);
    return found ? found.qty : 0;
  };

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.shopName}>Take My Coffee Out</Text>
        <Text style={styles.tagline}>Brewed with love ☕</Text>
      </View>

      {/* Category Filter */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={i => i}
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => setCategory(item)}
            style={[styles.categoryBtn, category === item && styles.categoryBtnActive]}
          >
            <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Menu Items */}
      {loading ? (
        <ActivityIndicator size="large" color="#5c3317" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items yet! 🫙</Text>
          <Text style={styles.emptySubText}>Owner hasn't added any items yet.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          numColumns={2}
          contentContainerStyle={styles.menuGrid}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardImage}>
  {item.imageUrl ? (
    <Image
      source={{ uri: item.imageUrl }}
      style={styles.cardPhoto}
      resizeMode="cover"
    />
  ) : (
    <Text style={styles.cardEmoji}>
      {item.category === 'Coffee' ? '☕' :
       item.category === 'Non-Coffee' ? '🧋' :
       item.category === 'Food' ? '🍽️' : '🥐'}
    </Text>
  )}
</View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.cardPrice}>₱{item.price}</Text>
                <TouchableOpacity
                  style={styles.addBtn}
                  onPress={() => addToCart(item)}
                >
                  <Text style={styles.addBtnText}>
                    {getQty(item.id) > 0 ? `Added (${getQty(item.id)})` : '+ Add'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={styles.cartFloat}
          onPress={() => navigation.navigate('Cart', { cart })}
        >
          <Text style={styles.cartFloatText}>
            🛒 View Cart ({totalItems} items)
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0ebe0',
  },
  header: {
    backgroundColor: '#2c1a0e',
    paddingTop: 55,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f0ebe0',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: '#c87941',
    marginTop: 2,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 55,
    backgroundColor: '#faf7f2',
  },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#f0ebe0',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#d4c5b0',
  },
  categoryBtnActive: {
    backgroundColor: '#5c3317',
    borderColor: '#5c3317',
  },
  categoryText: {
    fontSize: 13,
    color: '#8b5a2b',
    fontWeight: '600',
  },
  categoryTextActive: {
    color: '#faf7f2',
  },
  menuGrid: {
    padding: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#faf7f2',
    borderRadius: 16,
    margin: 6,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#2c1a0e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardImage: {
    backgroundColor: '#f0ebe0',
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardEmoji: {
    fontSize: 48,
  },
  cardBody: {
    padding: 10,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    color: '#8b5a2b',
    marginBottom: 6,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#5c3317',
    marginBottom: 8,
  },
  addBtn: {
    backgroundColor: '#5c3317',
    borderRadius: 8,
    paddingVertical: 7,
    alignItems: 'center',
  },
  addBtnText: {
    color: '#faf7f2',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 24,
    color: '#2c1a0e',
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 14,
    color: '#8b5a2b',
    marginTop: 8,
  },
  cartFloat: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#2c1a0e',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  cartFloatText: {
    color: '#f0ebe0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardPhoto: {
  width: '100%',
  height: '100%',
},
});