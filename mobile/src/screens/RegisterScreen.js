import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { COLORS, SHADOWS } from '../theme';

const ROLES = [
  { label: '🍳 Restaurant / Business', value: 'restaurant' },
  { label: '🏠 Household Donor', value: 'household' },
  { label: '🤝 NGO / Shelter', value: 'ngo' },
  { label: '🚴 Volunteer', value: 'volunteer' },
];

export default function RegisterScreen({ navigation }) {
  const { signIn } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password || !role) {
      Alert.alert('Missing fields', 'Please fill in all fields and select a role.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/register', { fullName, email: email.trim(), password, role });
      if (data.success) {
        await signIn(data.user, data.token);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <Ionicons name="leaf" size={28} color={COLORS.primary} />
          <Text style={styles.logoText}>Create Account</Text>
        </View>
        <Text style={styles.sub}>Join the food rescue network 🌍</Text>

        {/* Name */}
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Full name / Organization name" placeholderTextColor={COLORS.textMuted} value={fullName} onChangeText={setFullName} />
        </View>

        {/* Email */}
        <View style={styles.inputWrap}>
          <Ionicons name="mail-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput style={styles.input} placeholder="Email address" placeholderTextColor={COLORS.textMuted} keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        </View>

        {/* Password */}
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Password (min 6 chars)" placeholderTextColor={COLORS.textMuted} secureTextEntry={!showPass} value={password} onChangeText={setPassword} />
          <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
            <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Role selector */}
        <Text style={styles.roleLabel}>I am registering as:</Text>
        <View style={styles.roleGrid}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.value}
              style={[styles.roleChip, role === r.value && styles.roleChipActive]}
              onPress={() => setRole(r.value)}
            >
              <Text style={[styles.roleChipText, role === r.value && styles.roleChipTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={styles.linkText}>Already have an account? <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  inner: { flexGrow: 1, padding: 28, paddingTop: 50 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  logoText: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 14, color: COLORS.textMuted, marginBottom: 24 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.card, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: 14, marginBottom: 12, height: 52, ...SHADOWS.card
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, color: COLORS.text },
  roleLabel: { fontSize: 14, color: COLORS.text, fontWeight: '600', marginBottom: 10, marginTop: 4 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  roleChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  roleChipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  roleChipText: { fontSize: 13, color: COLORS.textMuted, fontWeight: '500' },
  roleChipTextActive: { color: COLORS.primary, fontWeight: '700' },
  btn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    height: 52, justifyContent: 'center', alignItems: 'center', ...SHADOWS.card
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { marginTop: 20, alignItems: 'center' },
  linkText: { fontSize: 14, color: COLORS.textMuted },
});
