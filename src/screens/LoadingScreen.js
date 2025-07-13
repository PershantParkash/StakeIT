import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

const LoadingScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>StakeIt</Text>
      <Text style={styles.subtitle}>Goal Setting & Accountability</Text>
      <ActivityIndicator 
        size="large" 
        color="#00d4ff" 
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 40,
  },
  spinner: {
    marginTop: 20,
  },
});

export default LoadingScreen; 