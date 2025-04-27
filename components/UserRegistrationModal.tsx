import React from 'react';
import { Modal, View, StyleSheet } from 'react-native';
import UserRegistrationForm from './UserRegistrationForm';

interface UserRegistrationModalProps {
  visible: boolean;
  onComplete: () => void;
}

const UserRegistrationModal: React.FC<UserRegistrationModalProps> = ({ visible, onComplete }) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <UserRegistrationForm onRegistrationComplete={onComplete} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
  },
});

export default UserRegistrationModal;