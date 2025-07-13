import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { goalsAPI } from '../services/api';

const CreateGoalScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: '',
    endDate: '',
    stakeAmount: '',
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return false;
    }

    if (!formData.endDate) {
      Alert.alert('Error', 'Please select an end date');
      return false;
    }

    if (!formData.stakeAmount || parseFloat(formData.stakeAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid stake amount');
      return false;
    }

    const endDate = new Date(formData.endDate);
    if (endDate <= new Date()) {
      Alert.alert('Error', 'End date must be in the future');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await goalsAPI.createGoal(formData);
      
      if (response.data.success) {
        Alert.alert(
          'Success!',
          'Your goal has been created successfully. Remember to check in daily to track your progress!',
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('Goals')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to create goal. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleDateSelect = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow);
    setFormData(prev => ({
      ...prev,
      endDate: tomorrow.toISOString().split('T')[0]
    }));
    setShowDatePicker(false);
  };

  const handleDateChange = (increment) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + increment);
    if (newDate > new Date()) {
      setSelectedDate(newDate);
      setFormData(prev => ({
        ...prev,
        endDate: newDate.toISOString().split('T')[0]
      }));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
        <TouchableOpacity 
            style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create New Goal</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Goal Title *</Text>
            <TextInput
              style={styles.input}
              value={formData.title}
              onChangeText={(value) => handleInputChange('title', value)}
              placeholder="e.g., Exercise 30 minutes daily"
              placeholderTextColor="#666"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Describe your goal in detail..."
              placeholderTextColor="#666"
              multiline
              numberOfLines={4}
              maxLength={500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(value) => handleInputChange('category', value)}
              placeholder="e.g., Fitness, Learning, Career, Health"
              placeholderTextColor="#666"
              maxLength={50}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tags (comma separated)</Text>
            <TextInput
              style={styles.input}
              value={formData.tags}
              onChangeText={(value) => handleInputChange('tags', value)}
              placeholder="e.g., exercise, daily, motivation"
              placeholderTextColor="#666"
              maxLength={100}
            />
            <Text style={styles.helperText}>
              Add tags to help organize and find your goals
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>End Date *</Text>
            <TouchableOpacity 
              style={styles.dateInput}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={formData.endDate ? styles.dateText : styles.placeholderText}>
                {formData.endDate ? formatDate(new Date(formData.endDate)) : 'Select end date'}
              </Text>
              <Text style={styles.dateIcon}>📅</Text>
            </TouchableOpacity>
            <Text style={styles.helperText}>
              Select the date when you want to complete this goal
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stake Amount ($) *</Text>
            <TextInput
              style={styles.input}
              value={formData.stakeAmount}
              onChangeText={(value) => handleInputChange('stakeAmount', value)}
              placeholder="50.00"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            <Text style={styles.helperText}>
              Amount you're willing to stake on this goal
            </Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <Text style={styles.infoText}>
              • 100% success: Get your full stake back{'\n'}
              • 70-99% success: Get 50% of your stake back{'\n'}
              • Below 70%: Lose your full stake
            </Text>
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.submitButtonText}>Create Goal</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModal}>
            <Text style={styles.modalTitle}>Select End Date</Text>
            
            <View style={styles.dateDisplay}>
              <TouchableOpacity onPress={() => handleDateChange(-1)}>
                <Text style={styles.dateArrow}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.selectedDateText}>
                {formatDate(selectedDate)}
              </Text>
              <TouchableOpacity onPress={() => handleDateChange(1)}>
                <Text style={styles.dateArrow}>▶</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButton}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleDateSelect}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
        </TouchableOpacity>
      </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#00d4ff',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    color: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#888',
    marginTop: 5,
  },
  infoBox: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginBottom: 30,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#00d4ff',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dateInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#fff',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
  dateIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  dateDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateArrow: {
    fontSize: 24,
    color: '#00d4ff',
    padding: 10,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#00d4ff',
    borderColor: '#00d4ff',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateGoalScreen; 