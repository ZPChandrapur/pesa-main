import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { WorkflowStep, Workflow } from '../types';
import { pesaSupabase } from '../config/supabase';
import { syncService } from '../utils/syncService';
import { offlineStorage } from '../utils/offlineStorage';
import { storageService } from '../utils/storageService';

interface StepEditScreenProps {
  navigation: any;
  route: any;
}

export const StepEditScreen: React.FC<StepEditScreenProps> = ({ navigation, route }) => {
  const step: WorkflowStep = route.params?.step;
  const workflow: Workflow = route.params?.workflow;

  const [status, setStatus] = useState(step.status);
  const [locationName, setLocationName] = useState(step.location_name || step.location_data?.location_name || '');
  const [locationData, setLocationData] = useState(step.location_data || null);
  const [photos, setPhotos] = useState<string[]>(step.completion_photos || []);
  const [photoMetas, setPhotoMetas] = useState<Array<{ latitude?: number; longitude?: number; accuracy?: number }>>(step.photo_metas || []);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

    if (cameraStatus !== 'granted' || locationStatus !== 'granted') {
      Alert.alert('Permissions Required', 'Camera and location permissions are required to use this feature.');
    }
  };

  const captureLocation = async () => {
    try {
      setCapturing(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lng = location.coords.longitude;

      try {
        const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        if (reverseGeocode.length > 0) {
          const address = reverseGeocode[0];
          const fullAddress = `${address.street || ''}, ${address.city || ''}, ${address.region || ''}`.trim();
          const locName = address.name || address.street || `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          setLocationData({
            latitude: lat,
            longitude: lng,
            address: fullAddress,
            location_name: locName,
          });
          setLocationName(locName);
        }
      } catch (error) {
        const locName = `Location ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setLocationData({
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          location_name: locName,
        });
        setLocationName(locName);
      }

      Alert.alert('Success', 'Location captured successfully');
    } catch (error) {
      console.error('Error capturing location:', error);
      Alert.alert('Error', 'Failed to capture location. Please try again.');
    } finally {
      setCapturing(false);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const localUri = result.assets[0].uri;

        setUploading(true);
        try {
          const publicUrl = await storageService.uploadWorkflowPhoto(
            localUri,
            workflow.id,
            step.id
          );
          setPhotos([...photos, publicUrl]);

          // Capture location metadata
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const newMeta = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined, // Ensure accuracy is undefined if null
          };
          setPhotoMetas([...photoMetas, newMeta]);

          Alert.alert('Success', 'Photo uploaded successfully');
        } catch (uploadError) {
          console.error('Error uploading photo:', uploadError);
          Alert.alert('Upload Failed', 'Photo will be saved locally and uploaded when online');
          setPhotos([...photos, localUri]);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets.length > 0) {
        setUploading(true);
        const uploadedUrls: string[] = [];

        try {
          for (const asset of result.assets) {
            try {
              const publicUrl = await storageService.uploadWorkflowPhoto(
                asset.uri,
                workflow.id,
                step.id
              );
              uploadedUrls.push(publicUrl);
            } catch (uploadError) {
              console.error('Error uploading photo:', uploadError);
              uploadedUrls.push(asset.uri);
            }
          }

          setPhotos([...photos, ...uploadedUrls]);
          Alert.alert('Success', `${uploadedUrls.length} photo(s) uploaded successfully`);
        } catch (error) {
          console.error('Error during upload process:', error);
        } finally {
          setUploading(false);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    Alert.alert(
      'Remove Photo',
      'Are you sure you want to remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const photoUrl = photos[index];
            const updated = photos.filter((_, i) => i !== index);
            setPhotos(updated);

            if (photoUrl.startsWith('http')) {
              try {
                await storageService.removeWorkflowPhoto(photoUrl);
              } catch (error) {
                console.error('Error removing photo from storage:', error);
              }
            }
          },
        },
      ]
    );
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      const updates: Partial<WorkflowStep> = {
        status,
        completion_photos: photos,
        photo_metas: photoMetas, // Include photo metadata
        location_data: locationData ? {
          ...locationData,
          location_name: locationName,
        } : locationData,
        location_name: locationName,
      };

      if (status === 'completed' && step.status !== 'completed') {
        updates.completed_at = new Date().toISOString();
      }

      await syncService.updateStepWithSync(step.id, workflow.id, updates);

      await offlineStorage.cacheData(`step_${step.id}`, { ...step, ...updates });

      Alert.alert('Success', 'Step updated successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving step:', error);
      Alert.alert('Saved Offline', 'Your changes have been saved and will sync when online');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const isOnline = syncService.getConnectionStatus();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{step.title}</Text>
        <Text style={styles.headerDescription}>{step.description}</Text>
        {!isOnline && (
          <View style={styles.offlineBadge}>
            <Text style={styles.offlineText}>📶 Offline Mode</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={status}
            onValueChange={setStatus}
            style={styles.picker}
          >
            <Picker.Item label="Pending" value="pending" />
            <Picker.Item label="In Progress" value="in_progress" />
            <Picker.Item label="Completed" value="completed" />
          </Picker>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Location</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter location name"
          value={locationName}
          onChangeText={setLocationName}
        />

        <TouchableOpacity
          style={styles.captureButton}
          onPress={captureLocation}
          disabled={capturing}
        >
          {capturing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.captureButtonIcon}>📍</Text>
              <Text style={styles.captureButtonText}>Capture Location</Text>
            </>
          )}
        </TouchableOpacity>

        {locationData && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationInfoTitle}>📍 {locationData.location_name}</Text>
            <Text style={styles.locationInfoText}>{locationData.address}</Text>
            <Text style={styles.locationInfoCoords}>
              {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Completion Photos</Text>

        {uploading && (
          <View style={styles.uploadingBanner}>
            <ActivityIndicator color="#3b82f6" />
            <Text style={styles.uploadingText}>Uploading photos...</Text>
          </View>
        )}

        <View style={styles.photoButtons}>
          <TouchableOpacity
            style={styles.photoButton}
            onPress={takePhoto}
            disabled={uploading}
          >
            <Text style={styles.photoButtonIcon}>📷</Text>
            <Text style={styles.photoButtonText}>Take Photo</Text>
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={[styles.photoButton, styles.photoButtonSecondary]}
            onPress={pickImage}
            disabled={uploading}
          >
            <Text style={styles.photoButtonIcon}>🖼️</Text>
            <Text style={styles.photoButtonText}>Pick from Gallery</Text>
          </TouchableOpacity> */}
        </View>

        {photos.length > 0 && (
          <View style={styles.photoGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.photoRemove}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.photoRemoveText}>✕</Text>
                </TouchableOpacity>
                {photoMetas[index] && (
                  <View style={styles.photoMeta}>
                    <Text style={styles.photoMetaText}>
                      Lat: {photoMetas[index].latitude?.toFixed(6)}
                    </Text>
                    <Text style={styles.photoMetaText}>
                      Lng: {photoMetas[index].longitude?.toFixed(6)}
                    </Text>
                    <Text style={styles.photoMetaText}>
                      Accuracy: {photoMetas[index].accuracy?.toFixed(2)}m
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ marginTop: 16 }}>
          <Text style={styles.helpText}>
            Supported formats: PNG, JPEG, JPG (Only 5 photos allowed)
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    backgroundColor: '#3b82f6',
    padding: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
  },
  headerDescription: {
    fontSize: 14,
    color: '#dbeafe',
  },
  offlineBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  offlineText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 12,
  },
  captureButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  captureButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  locationInfo: {
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  locationInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 4,
  },
  locationInfoText: {
    fontSize: 12,
    color: '#065f46',
    marginBottom: 4,
  },
  locationInfoCoords: {
    fontSize: 11,
    color: '#059669',
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  photoButtonSecondary: {
    backgroundColor: '#6b7280',
  },
  photoButtonIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  photoItem: {
    width: '30%',
    aspectRatio: 1,
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoRemove: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoRemoveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  uploadingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#1e40af',
    fontWeight: '600',
  },
  helpText: {
    fontSize: 11,
    color: '#6b7280',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 12,
    marginBottom: 32,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  photoMeta: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginTop: 8,
  },
  photoMetaText: {
    fontSize: 8,
    color: '#374151',
  },
});