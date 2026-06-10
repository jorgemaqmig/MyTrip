import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Dimensions,
  TextInput,
  Modal,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../context/ThemeContext';
import { useTrip } from '../context/TripContext';
import { useAuth } from '../context/AuthContext';
import { documentService } from '../services/documentService';
import type { TravelDocument, DocCategory, DocType } from '../services/documentService';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

// Categorias de documentos
const CATEGORIES: { id: DocCategory; icon: any; color: string }[] = [
  { id: 'Pasaporte', icon: 'card', color: '#FF3B30' },
  { id: 'Billete', icon: 'airplane', color: '#5856D6' },
  { id: 'Reserva', icon: 'bed', color: '#FF9500' },
  { id: 'Seguro', icon: 'shield-checkmark', color: '#34C759' },
  { id: 'Tickets', icon: 'receipt', color: '#AF52DE' },
  { id: 'Mapas', icon: 'map', color: '#007AFF' },
  { id: 'Otros', icon: 'document-text', color: '#8E8E93' },
];

// Pantalla de gestión de documentos del viaje
const VaultScreen = () => {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useTheme();
  const { activeTrip } = useTrip();
  const { user, userData } = useAuth();

  const [activeTab, setActiveTab] = useState<DocType>('Individual');
  const [modalVisible, setModalVisible] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<TravelDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [documents, setDocuments] = useState<TravelDocument[]>([]);

  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<DocType>('Individual');
  const [formCategory, setFormCategory] = useState<DocCategory>('Pasaporte');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerResult | null>(null);

  useEffect(() => {
    const tripId = activeTrip?.id;
    if (!tripId) {
      setLoading(false);
      return;
    }

    const unsubscribe = documentService.subscribeToDocuments(tripId, (data: TravelDocument[]) => {
      setDocuments(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeTrip?.id]);

  // Filtrar documentos según búsqueda, pestaña activa, categoría y propiedad
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = doc.type === activeTab;
    const matchesCategory = !selectedCategory || doc.category === selectedCategory;
    const isOwner = activeTab === 'Individual' ? doc.userId === user?.uid : true;
    return matchesSearch && matchesTab && matchesCategory && isOwner;
  });

  // Seleccionar documento
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true
      });

      if (!result.canceled) {
        setSelectedFile(result);
        if (!formTitle && result.assets && result.assets[0]) {
          setFormTitle(result.assets[0].name);
        }
      }
    } catch (err) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  // Manejar la subida del documento
  const handleAddDocument = async () => {
    const tripId = activeTrip?.id;
    const userId = user?.uid;

    if (!formTitle.trim() || !selectedFile || !tripId || !userId) {
      Alert.alert('Error', 'Por favor, rellena todos los campos');
      return;
    }

    if (selectedFile.canceled || !selectedFile.assets) return;

    setSubmitting(true);
    try {
      const file = selectedFile.assets[0];

      const blob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () { resolve(xhr.response); };
        xhr.onerror = function () { reject(new TypeError('Error al procesar el archivo local')); };
        xhr.responseType = 'blob';
        xhr.open('GET', file.uri, true);
        xhr.send(null);
      });

      const mime = file.mimeType || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

      await documentService.uploadDocument(
        tripId,
        userId,
        userData?.displayName || user.displayName || 'Viajero',
        formTitle,
        formCategory,
        formType,
        blob,
        file.name,
        mime
      );

      closeAddModal();
    } catch (error) {
      Alert.alert('Error', 'Fallo en la subida del archivo');
    } finally {
      setSubmitting(false);
    }
  };

  const isImage = (doc: TravelDocument) => {
    const mime = (doc.mimeType || "").toLowerCase();
    const name = (doc.fileName || "").toLowerCase();
    return mime.includes('image') ||
      name.endsWith('.jpg') || name.endsWith('.jpeg') ||
      name.endsWith('.png') || name.endsWith('.webp');
  };

  const handleDocPress = (docItem: TravelDocument) => {
    if (isImage(docItem)) {
      setSelectedDoc(docItem);
      setViewerVisible(true);
    } else {
      openFile(docItem);
    }
  };

  // Función para abrir y compartir el archivo
  const openFile = async (docItem: TravelDocument) => {
    try {
      const fs = FileSystem as any;
      const cacheDir = fs.cacheDirectory || fs.documentDirectory || "";
      const safeName = (docItem.fileName || "doc").replace(/[^a-zA-Z0-9.]/g, '_');
      const fileUri = cacheDir + safeName;

      const downloadResumable = fs.createDownloadResumable(docItem.fileUrl, fileUri);
      const result = await downloadResumable.downloadAsync();

      if (result && await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: docItem.mimeType || (safeName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          dialogTitle: docItem.title
        });
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir el archivo');
    }
  };

  // Función para eliminar un documento
  const deleteDocument = (docItem: TravelDocument) => {
    const tripId = activeTrip?.id;
    if (!tripId || !docItem.id) return;

    Alert.alert('Eliminar Documento', '¿Estás seguro de que quieres borrar este documento?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => documentService.deleteDocument(tripId, docItem.id!, docItem.storagePath) }
    ]);
  };

  const closeAddModal = () => {
    setModalVisible(false);
    setFormTitle('');
    setSelectedFile(null);
    setFormCategory('Pasaporte');
  };

  const renderDocItem = ({ item }: { item: TravelDocument }) => {
    const categoryInfo = CATEGORIES.find(c => c.id === item.category) || CATEGORIES[6];
    const isImg = isImage(item);

    return (
      <TouchableOpacity
        style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => handleDocPress(item)}
      >
        <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '15' }]}>
          <Ionicons name={isImg ? 'image' : categoryInfo.icon} size={24} color={categoryInfo.color} />
        </View>
        <View style={styles.docInfo}>
          <Text style={[styles.docTitle, { color: colors.text }]}>{item.title}</Text>
          <Text style={[styles.docMeta, { color: colors.textSecondary }]}>
            {item.category} • {activeTab === 'Colectivo' ? `Subido por ${item.userName}` : 'Privado'}
          </Text>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={() => deleteDocument(item)}>
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Renderizado principal
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Documentos</Text>
        <TouchableOpacity 
          onPress={() => {
            setFormType(activeTab);
            setModalVisible(true);
          }} 
          style={styles.addButton}
        >
          <LinearGradient colors={[colors.primary, isDark ? '#47a1ff' : '#00C6FF']} style={styles.plusButton}>
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <View style={[styles.tabsBg, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
          {(['Individual', 'Colectivo'] as DocType[]).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && [styles.activeTab, { backgroundColor: colors.card }]]}
              onPress={() => {
                setActiveTab(tab);
                setSelectedCategory(null);
              }}
            >
              <Text style={[styles.tabText, activeTab === tab ? { color: colors.text, fontWeight: '700' } : { color: colors.textSecondary }]}>
                {tab === 'Individual' ? 'Personales' : 'Colectivos'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Buscar documentos..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorías para filtrar */}
      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <TouchableOpacity
            style={[styles.categoryPill, !selectedCategory && { backgroundColor: colors.primary, borderColor: colors.primary }]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[styles.categoryPillText, !selectedCategory ? { color: '#fff' } : { color: colors.text }]}>Todos</Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryPill,
                { borderColor: colors.border, backgroundColor: colors.card },
                selectedCategory === cat.id && { backgroundColor: cat.color + '20', borderColor: cat.color }
              ]}
              onPress={() => setSelectedCategory(cat.id === selectedCategory ? null : cat.id)}
            >
              <Ionicons name={cat.icon} size={16} color={selectedCategory === cat.id ? cat.color : colors.textSecondary} />
              <Text style={[styles.categoryPillText, { color: selectedCategory === cat.id ? cat.color : colors.text }]}>{cat.id}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={filteredDocs}
          renderItem={renderDocItem}
          keyExtractor={item => item.id || Math.random().toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={60} color={colors.textSecondary} style={{ opacity: 0.2, marginBottom: 15 }} />
              <Text style={{ color: colors.textSecondary, fontSize: 16 }}>No se han encontrado documentos</Text>
            </View>
          }
        />
      )}

      {/* Modal Subir */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo Documento</Text>
              <TouchableOpacity onPress={closeAddModal}><Ionicons name="close" size={28} color={colors.text} /></TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={[styles.typeSelector, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
                {(['Individual', 'Colectivo'] as DocType[]).map((type) => (
                  <TouchableOpacity key={type} style={[styles.typeOption, formType === type && { backgroundColor: colors.primary }]} onPress={() => setFormType(type)}>
                    <Text style={[styles.typeText, formType === type ? { color: '#fff' } : { color: colors.textSecondary }]}>{type === 'Individual' ? 'Personal' : 'Colectivo'}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                placeholder="Título del documento"
                placeholderTextColor={colors.textSecondary}
                value={formTitle}
                onChangeText={setFormTitle}
              />

              <Text style={styles.label}>Categoría</Text>
              <View style={styles.categoriesGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catItem, formCategory === cat.id && { backgroundColor: cat.color + '15', borderColor: cat.color }]}
                    onPress={() => setFormCategory(cat.id)}
                  >
                    <Ionicons name={cat.icon} size={20} color={formCategory === cat.id ? cat.color : colors.textSecondary} />
                    <Text style={[styles.catLabel, { color: formCategory === cat.id ? cat.color : colors.textSecondary }]}>{cat.id}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.uploadBox, selectedFile && { borderColor: colors.primary, backgroundColor: colors.primary + '05' }]} onPress={pickDocument}>
                <Ionicons name={selectedFile ? "checkmark-circle" : "cloud-upload-outline"} size={30} color={selectedFile ? colors.primary : colors.textSecondary} />
                <Text style={[styles.uploadText, { color: colors.text }]}>{selectedFile ? selectedFile.assets?.[0].name : "Seleccionar Archivo"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddDocument} disabled={submitting}>
                <LinearGradient colors={[colors.primary, isDark ? '#47a1ff' : '#00C6FF']} style={styles.submitGradient}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Subir Documento</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Visor de Imágenes */}
      <Modal visible={viewerVisible} animationType="fade" transparent>
        <View style={styles.viewerContainer}>
          <TouchableOpacity style={styles.closeViewer} onPress={() => setViewerVisible(false)}>
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          {selectedDoc && (
            <View style={styles.viewerContent}>
              <Image source={{ uri: selectedDoc.fileUrl }} style={styles.fullImage} resizeMode="contain" />
              <View style={styles.viewerFooter}>
                <Text style={styles.viewerTitle}>{selectedDoc.title}</Text>
                <TouchableOpacity style={styles.exportBtn} onPress={() => openFile(selectedDoc)}>
                  <Ionicons name="share-outline" size={20} color="#fff" />
                  <Text style={styles.exportText}>Compartir</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Estilos de la pantalla de documentos
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 22, fontWeight: '800' },
  iconButton: { width: 44, height: 44, justifyContent: 'center' },
  addButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-end' },
  plusButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', elevation: 4 },
  tabsContainer: { paddingHorizontal: 20, marginBottom: 10 },
  tabsBg: { flexDirection: 'row', borderRadius: 14, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeTab: { elevation: 2, shadowOpacity: 0.1, shadowRadius: 4 },
  tabText: { fontSize: 14 },
  searchContainer: { paddingHorizontal: 20, marginBottom: 15 },
  searchBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, height: 50, borderRadius: 15, borderWidth: 1 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  categoriesSection: { marginBottom: 15 },
  categoriesScroll: { paddingHorizontal: 20, gap: 8 },
  categoryPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, gap: 6 },
  categoryPillText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 100 },
  docCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 20, marginBottom: 12, borderWidth: 1 },
  categoryIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  docInfo: { flex: 1 },
  docTitle: { fontSize: 16, fontWeight: '700' },
  docMeta: { fontSize: 12, marginTop: 2 },
  moreButton: { padding: 5 },
  emptyState: { alignItems: 'center', marginTop: 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', padding: 24, borderRadius: 25, borderWidth: 1, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800' },
  typeSelector: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 15 },
  typeOption: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  typeText: { fontSize: 14, fontWeight: '600' },
  input: { height: 55, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '700', marginBottom: 10, marginLeft: 2 },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  catItem: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', gap: 5 },
  catLabel: { fontSize: 12, fontWeight: '600' },
  uploadBox: { height: 90, borderStyle: 'dashed', borderWidth: 2, borderRadius: 15, borderColor: '#007AFF33', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  uploadText: { marginTop: 8, fontSize: 14, fontWeight: '600' },
  submitButton: { borderRadius: 15, overflow: 'hidden' },
  submitGradient: { height: 55, justifyContent: 'center', alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  viewerContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.98)', justifyContent: 'center' },
  closeViewer: { position: 'absolute', top: 50, right: 25, zIndex: 10, padding: 10 },
  viewerContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  fullImage: { width: width, height: height * 0.75 },
  viewerFooter: { position: 'absolute', bottom: 60, width: '100%', alignItems: 'center', paddingHorizontal: 30 },
  viewerTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 20, textAlign: 'center' },
  exportBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 25, paddingVertical: 12, borderRadius: 20 },
  exportText: { color: '#fff', fontWeight: '600' }
});

export default VaultScreen;
