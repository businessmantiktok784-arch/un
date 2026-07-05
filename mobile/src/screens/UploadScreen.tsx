import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@rneui/themed';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, FileText, CheckCircle2, ChevronDown } from 'lucide-react-native';
import { supabase } from '../lib/supabase';

const docTypes = ['Exam', 'CAT', 'Assignment', 'Notes', 'Lab Report', 'Project', 'Past Paper', 'Other'];

export default function UploadScreen() {
  const { theme } = useTheme();
  const [file, setFile] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [university, setUniversity] = useState('');
  const [docType, setDocType] = useState('Exam');
  const [faculty, setFaculty] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  async function pickDocument() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setFile(result.assets[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async function handleUpload() {
    if (!file) { Alert.alert('Select a file', 'Please choose a PDF document to upload.'); return; }
    if (!title || !courseCode || !university) { Alert.alert('Missing info', 'Please fill in the required fields (title, course code, university).'); return; }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Sign in required', 'Please sign in to upload documents.'); setUploading(false); return; }

      // Upload file to storage
      const fileExt = file.name.split('.').pop() ?? 'pdf';
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `uploads/${user.id}/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage.from('documents').upload(filePath, blob, {
        contentType: 'application/pdf',
      });
      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase.from('documents').insert({
        title,
        course_code: courseCode,
        course_name: courseName || null,
        university,
        doc_type: docType as any,
        faculty: faculty || null,
        semester: semester || null,
        academic_year: academicYear || null,
        description: description || null,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : null,
        storage_path: filePath,
        file_size_bytes: file.size ?? 0,
        mime_type: 'application/pdf',
        status: 'pending',
        uploader_id: user.id,
      });
      if (dbError) throw dbError;

      setSubmitted(true);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message || 'Could not upload document.');
    } finally {
      setUploading(false);
    }
  }

  function reset() {
    setFile(null);
    setTitle('');
    setCourseCode('');
    setCourseName('');
    setUniversity('');
    setDocType('Exam');
    setFaculty('');
    setSemester('');
    setAcademicYear('');
    setDescription('');
    setTags('');
    setSubmitted(false);
  }

  if (submitted) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.colors.primary + '15' }]}>
            <CheckCircle2 size={48} color={theme.colors.primary} />
          </View>
          <Text style={[styles.successTitle, { color: theme.colors.grey0 }]}>Upload Submitted!</Text>
          <Text style={[styles.successSub, { color: theme.colors.grey2 }]}>
            Your document has been submitted for review. You'll be notified once it's approved.
          </Text>
          <TouchableOpacity style={[styles.uploadAgainBtn, { backgroundColor: theme.colors.primary }]} onPress={reset}>
            <Text style={styles.uploadAgainText}>Upload Another</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.title, { color: theme.colors.grey0 }]}>Upload</Text>
        <Text style={[styles.subtitle, { color: theme.colors.grey2 }]}>Share your study materials with the community</Text>

        {/* File Picker */}
        <TouchableOpacity style={[styles.filePicker, { backgroundColor: theme.colors.white, borderColor: file ? theme.colors.primary : theme.colors.grey4 }]} onPress={pickDocument}>
          {file ? (
            <>
              <FileText size={32} color={theme.colors.primary} />
              <Text style={[styles.fileName, { color: theme.colors.grey0 }]} numberOfLines={1}>{file.name}</Text>
              <Text style={[styles.fileSize, { color: theme.colors.grey2 }]}>{(file.size / 1024 / 1024).toFixed(2)} MB</Text>
            </>
          ) : (
            <>
              <Upload size={32} color={theme.colors.grey3} />
              <Text style={[styles.filePickerText, { color: theme.colors.grey2 }]}>Tap to select a PDF</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Form */}
        <View style={styles.form}>
          <Text style={[styles.label, { color: theme.colors.grey0 }]}>Title *</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g., Data Structures Final Exam 2024" placeholderTextColor={theme.colors.grey3} value={title} onChangeText={setTitle} />

          <Text style={[styles.label, { color: theme.colors.grey0 }]}>Course Code *</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g., CS201" placeholderTextColor={theme.colors.grey3} value={courseCode} onChangeText={setCourseCode} autoCapitalize="characters" />

          <Text style={[styles.label, { color: theme.colors.grey0 }]}>Course Name</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g., Data Structures and Algorithms" placeholderTextColor={theme.colors.grey3} value={courseName} onChangeText={setCourseName} />

          <Text style={[styles.label, { color: theme.colors.grey0 }]}>University *</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g., University of Kigali" placeholderTextColor={theme.colors.grey3} value={university} onChangeText={setUniversity} />

          <Text style={[styles.label, { color: theme.colors.grey0 }]}>Document Type</Text>
          <View style={styles.typeGrid}>
            {docTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, { backgroundColor: docType === type ? theme.colors.primary : theme.colors.white }]}
                onPress={() => setDocType(type)}
              >
                <Text style={{ color: docType === type ? '#fff' : theme.colors.grey2, fontSize: 12, fontWeight: '500' }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, { color: theme.colors.grey0 }]}>Faculty</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g., Engineering" placeholderTextColor={theme.colors.grey3} value={faculty} onChangeText={setFaculty} />

          <Text style={[styles.label, { color: theme.colors.grey0 }]}>Semester</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g., Fall 2024" placeholderTextColor={theme.colors.grey3} value={semester} onChangeText={setSemester} />

          <Text style={[styles.label, { color: theme.colors.grey0 }]}>Academic Year</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g., 2024-2025" placeholderTextColor={theme.colors.grey3} value={academicYear} onChangeText={setAcademicYear} />

          <Text style={[styles.label, { color: theme.colors.grey0 }]}>Description</Text>
          <TextInput
            style={[styles.input, styles.textarea, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]}
            placeholder="Brief description of the document..."
            placeholderTextColor={theme.colors.grey3}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: theme.colors.grey0 }]}>Tags (comma-separated)</Text>
          <TextInput style={[styles.input, { backgroundColor: theme.colors.white, color: theme.colors.grey0 }]} placeholder="e.g. final, semester1, 2024" placeholderTextColor={theme.colors.grey3} value={tags} onChangeText={setTags} />
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: theme.colors.primary }, uploading && { opacity: 0.7 }]}
          onPress={handleUpload}
          disabled={uploading}
        >
          <Text style={styles.submitBtnText}>{uploading ? 'Uploading...' : 'Submit Document'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 20 },
  filePicker: { alignItems: 'center', justifyContent: 'center', paddingVertical: 32, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', marginBottom: 20 },
  filePickerText: { marginTop: 8, fontSize: 14 },
  fileName: { marginTop: 8, fontSize: 14, fontWeight: '600', maxWidth: 250 },
  fileSize: { marginTop: 4, fontSize: 12 },
  form: { gap: 12 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  input: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, fontSize: 15, backgroundColor: '#f0f2f5' },
  textarea: { minHeight: 80, paddingTop: 12 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  submitBtn: { marginTop: 24, paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  successIcon: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  successSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  uploadAgainBtn: { marginTop: 24, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16 },
  uploadAgainText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
