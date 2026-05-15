import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, Alert,
  ScrollView, Modal
} from 'react-native';
import {
  collection, onSnapshot, addDoc,
  updateDoc, deleteDoc, doc
} from 'firebase/firestore';
import { db } from '../firebase';

const CATEGORIES = ['Coffee', 'Non-Coffee', 'Food', 'Pastry'];

export default function MenuManager({ navigation }) {
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Coffee');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'menu'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(data);
    });
    return unsub;
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setPrice('');
    setDescription('');
    setCategory('Coffee');
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setName(item.name);
    setPrice(String(item.price));
    setDescription(item.description || '');
    setCategory(item.category || 'Coffee');
    setModalVisible(true);
  };

  const saveItem = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Please enter item name!'); return; }
    if (!price.trim() || isNaN(price)) { Alert.alert('Error', 'Please enter a valid price!'); return; }

    setLoading(true);
    try {
      if (editing) {
        await updateDoc(doc(db, 'menu', editing.id), {
          name: name.trim(),
          price: parseFloat(price),
          description: description.trim(),
          category,
        });
      } else {
        await addDoc(collection(db, 'menu'), {
          name: name.trim(),
          price: parseFloat(price),
          description: description.trim(),
          category,
          available: true,
        });
      }
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to save item.');
      console.error(e);
    }
    setLoading(false);
  };

  const deleteItem = (item) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.name}" from the menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'menu', item.id));
            } catch (e) {
              Alert.alert('Error', 'Failed to delete item.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Menu Manager</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No menu items yet! 🫙</Text>
            <Text style={styles.emptySubText}>Tap "+ Add" to add your first item.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemEmoji}>
              <Text style={styles.itemEmojiText}>
                {item.category === 'Coffee' ? '☕' :
                 item.category === 'Non-Coffee' ? '🧋' :
                 item.category === 'Food' ? '🍽️' : '🥐'}
              </Text>
            </View>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCategory}>{item.category}</Text>
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={1}>{item.description}</Text>
              ) : null}
              <Text style={styles.itemPrice}>₱{item.price}</Text>
            </View>
            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEdit(item)}
              >
                <Text style={styles.editBtnText}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => deleteItem(item)}
              >
                <Text style={styles.deleteBtnText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editing ? '✏️ Edit Item' : '☕ Add New Item'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Name */}
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Caramel Latte"
                placeholderTextColor="#a89070"
                value={name}
                onChangeText={setName}
              />

              {/* Price */}
              <Text style={styles.label}>Price (₱) *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 120"
                placeholderTextColor="#a89070"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
              />

              {/* Description */}
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.descInput]}
                placeholder="Short description of the item"
                placeholderTextColor="#a89070"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              {/* Category */}
              <Text style={styles.label}>Category *</Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setCategory(c)}
                    style={[
                      styles.categoryBtn,
                      category === c && styles.categoryBtnActive
                    ]}
                  >
                    <Text style={[
                      styles.categoryBtnText,
                      category === c && styles.categoryBtnTextActive
                    ]}>
                      {c}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Buttons */}
              <View style={styles.modalBtns}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
                  onPress={saveItem}
                  disabled={loading}
                >
                  <Text style={styles.saveBtnText}>
                    {loading ? 'Saving...' : editing ? 'Save Changes' : 'Add Item'}
                  </Text>
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
    backgroundColor: '#2c1a0e',
    paddingTop: 55,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {},
  backText: {
    color: '#c87941',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f0ebe0',
  },
  addBtn: {
    backgroundColor: '#c87941',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: {
    color: '#faf7f2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    fontSize: 20,
    color: '#2c1a0e',
    fontWeight: 'bold',
  },
  emptySubText: {
    fontSize: 14,
    color: '#8b5a2b',
    marginTop: 8,
  },
  itemCard: {
    backgroundColor: '#faf7f2',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#2c1a0e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemEmoji: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#f0ebe0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemEmojiText: {
    fontSize: 28,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2c1a0e',
  },
  itemCategory: {
    fontSize: 11,
    color: '#8b5a2b',
    marginTop: 2,
  },
  itemDesc: {
    fontSize: 12,
    color: '#a89070',
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#5c3317',
    marginTop: 4,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f0ebe0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnText: {
    fontSize: 18,
  },
  deleteBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#fde8e8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnText: {
    fontSize: 18,
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
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c1a0e',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5c3317',
    marginBottom: 6,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#f0ebe0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#2c1a0e',
    borderWidth: 1,
    borderColor: '#d4c5b0',
    marginBottom: 12,
  },
  descInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f0ebe0',
    borderWidth: 1,
    borderColor: '#d4c5b0',
  },
  categoryBtnActive: {
    backgroundColor: '#5c3317',
    borderColor: '#5c3317',
  },
  categoryBtnText: {
    fontSize: 13,
    color: '#8b5a2b',
    fontWeight: '600',
  },
  categoryBtnTextActive: {
    color: '#faf7f2',
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
  saveBtn: {
    flex: 1,
    backgroundColor: '#5c3317',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    backgroundColor: '#a89070',
  },
  saveBtnText: {
    color: '#faf7f2',
    fontWeight: 'bold',
    fontSize: 15,
  },
}); 