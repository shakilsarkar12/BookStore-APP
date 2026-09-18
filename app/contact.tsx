import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../src/components/Header';
import { colors } from '../src/theme/colors';
import { typography, radii, spacing, shadows } from '../src/theme/typography';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'How does shipping work for physical books?',
    answer:
      'We pack every book with protective acid-free cardboard and bubble wrap. Orders over $45 qualify for free standard delivery (2-4 business days).',
  },
  {
    question: 'Can I purchase digital E-Books and Audio editions?',
    answer:
      'Yes! When selecting the E-Book format, your download link and e-reader credentials are sent immediately upon checkout.',
  },
  {
    question: 'Do you offer signed or first edition copies?',
    answer:
      'Our Curated Editions and Collector copies often include publisher bookplates or author signatures. Look for the "Collector" tag in product details.',
  },
  {
    question: 'What is your bookstore return policy?',
    answer:
      'We accept returns within 30 days of delivery in original, unread condition with our hassle-free return prepaid labels.',
  },
];

export default function ContactScreen() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  const handleSubmit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Required Fields', 'Please fill in all fields before submitting.');
      return;
    }

    setSubmitted(true);
    Alert.alert(
      'Message Received',
      'Thank you for reaching out to Alexandria Books! Our literary support team will respond within 24 hours.',
      [
        {
          text: 'OK',
          onPress: () => {
            setName('');
            setEmail('');
            setMessage('');
            setSubmitted(false);
          },
        },
      ]
    );
  };

  const toggleFaq = (index: number) => {
    setExpandedFaqIndex(expandedFaqIndex === index ? null : index);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header title="Customer Support" subtitle="Help & Inquiries" showBack />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bookstore Contact Info Cards */}
        <View style={styles.infoCardsGrid}>
          <View style={styles.infoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.infoLabel}>Email Support</Text>
            <Text style={styles.infoValue}>support@alexandriabooks.com</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.iconCircle}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </View>
            <Text style={styles.infoLabel}>Literary Concierge</Text>
            <Text style={styles.infoValue}>+1 (800) 555-BOOK</Text>
          </View>
        </View>

        {/* Store Hours Card */}
        <View style={styles.hoursCard}>
          <View style={styles.hoursRow}>
            <Ionicons name="time-outline" size={18} color={colors.accent} />
            <Text style={styles.hoursTitle}>Customer Service Hours</Text>
          </View>
          <Text style={styles.hoursDesc}>
            Monday – Friday: 8:00 AM – 8:00 PM EST{'\n'}
            Saturday – Sunday: 10:00 AM – 6:00 PM EST
          </Text>
        </View>

        {/* FAQs Section */}
        <View style={styles.faqSection}>
          <Text style={styles.sectionHeading}>Frequently Asked Questions</Text>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedFaqIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqHeaderRow}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={colors.textMuted}
                  />
                </View>
                {isExpanded ? (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Contact Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Send Us a Message</Text>
          <Text style={styles.formSubtitle}>
            Have questions about an edition, special request, or bulk school order?
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Eleanor Vance"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. eleanor@example.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Your Inquiry or Question</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell us about the book or order you need help with..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={message}
              onChangeText={setMessage}
            />
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.88}
          >
            <Text style={styles.submitButtonText}>Submit Inquiry</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  infoCardsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  infoValue: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  hoursCard: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  hoursTitle: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  hoursDesc: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  faqSection: {
    marginBottom: spacing.xl,
  },
  sectionHeading: {
    ...typography.h3,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  faqItem: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    ...typography.subtitle,
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  faqAnswer: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...shadows.subtle,
  },
  formTitle: {
    ...typography.h2,
    fontSize: 18,
    color: colors.textPrimary,
  },
  formSubtitle: {
    ...typography.bodySmall,
    color: colors.textMuted,
    marginTop: 2,
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    ...typography.body,
    color: colors.textPrimary,
  },
  textArea: {
    height: 90,
    paddingTop: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
