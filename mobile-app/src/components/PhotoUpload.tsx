import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';

interface PhotoUploadProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  photoMetas: Array<{ latitude?: number; longitude?: number; accuracy?: number }>;
  onPhotoMetaChange: (metas: Array<{ latitude?: number; longitude?: number; accuracy?: number }>) => void;
  disabled?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ photos, onPhotosChange, photoMetas, onPhotoMetaChange, disabled }) => {
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const handleAddPhoto = async () => {
    if (disabled) return;

    // Simulate photo upload
    const newPhoto = `photo_${photos.length + 1}.jpg`;
    const updatedPhotos = [...photos, newPhoto];
    onPhotosChange(updatedPhotos);

    // Fetch location metadata
    setIsFetchingLocation(true);
    try {
      const location = await getLocation();
      const updatedMetas = [...photoMetas, location];
      onPhotoMetaChange(updatedMetas);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch location.');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number; accuracy: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser.'));
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          resolve({ latitude, longitude, accuracy });
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  return (
    <View style={{ padding: 16, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 12 }}>
      <Text style={{ color: '#888' }}>PhotoUpload Component</Text>
      <Text style={{ color: '#888', fontSize: 12 }}>Photos: {photos.length}</Text>
      <Text style={{ color: '#888', fontSize: 12 }}>PhotoMetas: {photoMetas.length}</Text>
      {isFetchingLocation && <Text style={{ color: 'blue', fontSize: 12 }}>Fetching location...</Text>}
      <Button title="Add Photo" onPress={handleAddPhoto} disabled={disabled || isFetchingLocation} />
    </View>
  );
};

export default PhotoUpload;
