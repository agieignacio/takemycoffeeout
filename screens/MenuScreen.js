import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
  SectionList, Modal, ScrollView
} from 'react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIES = ['All', 'Coffee', 'Non-Coffee', 'Food', 'Pastry'];

const CATEGORY_EMOJIS = {
  Coffee: '☕',
  'Non-Coffee': '🧋',
  Food: '🍽️',
  Pastry: '🥐',
};

const SIZES = ['Pochi', 'Petite', 'Large'];
const TEMPS = ['Hot', 'Iced'];

export default function MenuScreen({ navigation }) {
  const [menuItems, setMenuItems] = useState([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [customItem, setCustomItem] = useState(null);
  const [selectedSize, setSelectedSize] = useState('Petite');
  const [selectedTemp, setSelectedTemp] = useState('Hot');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMenuItems(items);
      setLoading(false);
    });
    return unsub;
  }, []);

  const isCoffeeType = (cat) => cat === 'Coffee' || cat === 'Non-Coffee';
  const isCoffee = (cat) => cat === 'Coffee';

  const openCustomize = (item) => {
    setCustomItem(item);
    setSelectedSize('Petite');
    setSelectedTemp('Hot');
    setModalVisible(true);
  };

  const addToCart = () => {
    if (!customItem) return;
    const cartKey = `${customItem.id}_${selectedSize}_${selectedTemp}`;
    setCart(prev => {
      const exists = prev.find(c => c.cartKey === cartKey);
      if (exists) {
        return prev.map(c => c.cartKey === cartKey ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, {
        ...customItem,
        cartKey,
        qty: 1,
        size: isCoffeeType(customItem.category) ? selectedSize : null,
        temp: isCoffee(customItem.category) ? selectedTemp : null,
      }];
    });
    setModalVisible(false);
  };

  const getQty = (id) => {
    return cart.filter(c => c.id === id).reduce((sum, c) => sum + c.qty, 0);
  };

  const updateCartQty = (cartKey, change) => {
    setCart(prev =>
      prev.map(i => i.cartKey === cartKey
        ? { ...i, qty: Math.max(0, i.qty + change) }
        : i
      ).filter(i => i.qty > 0)
    );
  };

  const removeFromCart = (cartKey) => {
    setCart(prev => prev.filter(i => i.cartKey !== cartKey));
  };

  const totalItems = cart.reduce((sum, c) => sum + c.qty, 0);

  const buildSections = () => {
    const grouped = {};
    CATEGORIES.slice(1).forEach(cat => {
      const items = menuItems.filter(i => i.category === cat);
      if (items.length > 0) grouped[cat] = items;
    });
    return Object.entries(grouped).map(([title, data]) => ({ title, data }));
  };

  const filtered = menuItems.filter(i => i.category === category);

  const renderCard = (item) => {
    const isExpanded = expandedId === item.id;
    const qty = getQty(item.id);

    return (
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
              {CATEGORY_EMOJIS[item.category] || '☕'}
            </Text>
          )}
        </View>

        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{item.category}</Text>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.cardPrice}>₱{item.price}</Text>

          {item.description ? (
            <TouchableOpacity
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
              style={styles.descToggle}
            >
              <Text style={styles.descToggleText}>
                {isExpanded ? '▲ Hide details' : '▼ View details'}
              </Text>
            </TouchableOpacity>
          ) : null}

          {isExpanded && (
            <Text style={styles.cardDesc}>{item.description}</Text>
          )}

          <TouchableOpacity
            style={[styles.addBtn, qty > 0 && styles.addBtnActive]}
            onPress={() => openCustomize(item)}
          >
            <Text style={styles.addBtnText}>
              {qty > 0 ? `+ Add More (${qty})` : '+ Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.shopName}>Take My Coffee Out</Text>
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
              {item === 'All' ? '🍽️ All' :
               item === 'Coffee' ? '☕ Coffee' :
               item === 'Non-Coffee' ? '🧋 Non-Coffee' :
               item === 'Food' ? '🍽️ Food' : '🥐 Pastry'}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#5c3317" style={{ marginTop: 40 }} />
      ) : category === 'All' ? (
        menuItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No items yet! 🫙</Text>
            <Text style={styles.emptySubText}>Owner hasn't added any items yet.</Text>
          </View>
        ) : (
          <SectionList
            sections={buildSections()}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.menuGrid}
            stickySectionHeadersEnabled={false}
            renderSectionHeader={({ section: { title } }) => (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionHeaderText}>
                  {CATEGORY_EMOJIS[title]} {title}
                </Text>
                <View style={styles.sectionLine} />
              </View>
            )}
            renderItem={({ item, index, section }) => {
              if (index % 2 !== 0) return null;
              const nextItem = section.data[index + 1];
              return (
                <View style={styles.cardRow}>
                  {renderCard(item)}
                  {nextItem ? renderCard(nextItem) : <View style={styles.cardPlaceholder} />}
                </View>
              );
            }}
          />
        )
      ) : (
        filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {category} items yet! 🫙</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={item => item.id}
            numColumns={2}
            contentContainerStyle={styles.menuGrid}
            renderItem={({ item }) => renderCard(item)}
          />
        )
      )}

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <TouchableOpacity
          style={styles.cartFloat}
          onPress={() => navigation.navigate('Cart', {
            cart,
            onCartUpdate: (updatedCart) => setCart(updatedCart),
          })}
        >
          <Text style={styles.cartFloatText}>
            🛒 View Cart ({totalItems} items)
          </Text>
        </TouchableOpacity>
      )}

      {/* Customization Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View style={styles.modalImageBox}>
                {customItem?.imageUrl ? (
                  <Image
                    source={{ uri: customItem.imageUrl }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={styles.modalEmoji}>
                    {CATEGORY_EMOJIS[customItem?.category] || '☕'}
                  </Text>
                )}
              </View>
              <View style={styles.modalItemInfo}>
                <Text style={styles.modalItemName}>{customItem?.name}</Text>
                <Text style={styles.modalItemPrice}>₱{customItem?.price}</Text>
                <Text style={styles.modalItemCategory}>{customItem?.category}</Text>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>

              {/* Size — Coffee and Non-Coffee only */}
              {isCoffeeType(customItem?.category) && (
                <>
                  <Text style={styles.customLabel}>☕ Size</Text>
                  <View style={styles.optionRow}>
                    {SIZES.map(s => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setSelectedSize(s)}
                        style={[
                          styles.optionBtn,
                          selectedSize === s && styles.optionBtnActive
                        ]}
                      >
                        <Text style={[
                          styles.optionBtnText,
                          selectedSize === s && styles.optionBtnTextActive
                        ]}>
                          {s === 'Pochi' ? '🥤 Pochi' :
                           s === 'Petite' ? '☕ Petite' : '🧋 Large'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Temperature — Coffee only */}
              {isCoffee(customItem?.category) && (
                <>
                  <Text style={styles.customLabel}>🌡️ Temperature</Text>
                  <View style={styles.optionRow}>
                    {TEMPS.map(t => (
                      <TouchableOpacity
                        key={t}
                        onPress={() => setSelectedTemp(t)}
                        style={[
                          styles.optionBtn,
                          selectedTemp === t && styles.optionBtnActive
                        ]}
                      >
                        <Text style={[
                          styles.optionBtnText,
                          selectedTemp === t && styles.optionBtnTextActive
                        ]}>
                          {t === 'Hot' ? '🔥 Hot' : '🧊 Iced'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Summary */}
              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Order Summary</Text>
                <Text style={styles.summaryText}>
                  {customItem?.name}
                  {isCoffeeType(customItem?.category) ? ` — ${selectedSize}` : ''}
                  {isCoffee(customItem?.category) ? ` — ${selectedTemp}` : ''}
                </Text>
                <Text style={styles.summaryPrice}>₱{customItem?.price}</Text>
              </View>

              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmBtn}
                  onPress={addToCart}
                >
                  <Text style={styles.confirmBtnText}>Add to Cart ✓</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0ebe0',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0d5c5',
  },
  shopName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#5c3317',
    letterSpacing: 1,
  },
  categoryList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 55,
    backgroundColor: '#faf7f2',
  },
  categoryBtn: {
    paddingHorizontal: 14,
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
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginBottom: 6,
  },
  sectionLine: {
    height: 2,
    backgroundColor: '#d4c5b0',
    borderRadius: 2,
  },
  menuGrid: {
    padding: 12,
    paddingBottom: 100,
  },
  cardRow: {
    flexDirection: 'row',
  },
  cardPlaceholder: {
    flex: 1,
    margin: 6,
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
  cardPhoto: {
    width: '100%',
    height: '100%',
  },
  cardEmoji: {
    fontSize: 48,
  },
  categoryBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#2c1a0ecc',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: '#faf7f2',
    fontSize: 9,
    fontWeight: 'bold',
  },
  cardBody: {
    padding: 10,
  },
  cardName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginBottom: 2,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5c3317',
    marginBottom: 6,
  },
  descToggle: {
    marginBottom: 6,
  },
  descToggleText: {
    fontSize: 11,
    color: '#8b5a2b',
    fontWeight: '600',
  },
  cardDesc: {
    fontSize: 11,
    color: '#8b5a2b',
    marginBottom: 8,
    lineHeight: 16,
  },
  addBtn: {
    backgroundColor: '#5c3317',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  addBtnActive: {
    backgroundColor: '#2c6e2e',
  },
  addBtnText: {
    color: '#faf7f2',
    fontSize: 11,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#faf7f2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  modalImageBox: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#f0ebe0',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  modalImage: { width: 70, height: 70 },
  modalEmoji: { fontSize: 36 },
  modalItemInfo: { flex: 1 },
  modalItemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c1a0e',
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5c3317',
    marginTop: 2,
  },
  modalItemCategory: {
    fontSize: 12,
    color: '#8b5a2b',
    marginTop: 2,
  },
  customLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginBottom: 10,
    marginTop: 4,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: '#f0ebe0',
    borderWidth: 1.5,
    borderColor: '#d4c5b0',
    alignItems: 'center',
  },
  optionBtnActive: {
    backgroundColor: '#5c3317',
    borderColor: '#5c3317',
  },
  optionBtnText: {
    fontSize: 12,
    color: '#8b5a2b',
    fontWeight: '600',
  },
  optionBtnTextActive: {
    color: '#faf7f2',
  },
  summaryBox: {
    backgroundColor: '#f0ebe0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#d4c5b0',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: '#5c3317',
    fontWeight: '600',
  },
  summaryPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginTop: 4,
  },
  modalBtns: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#f0ebe0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4c5b0',
  },
  cancelBtnText: {
    color: '#8b5a2b',
    fontWeight: 'bold',
    fontSize: 15,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#5c3317',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#faf7f2',
    fontWeight: 'bold',
    fontSize: 15,
  },
});