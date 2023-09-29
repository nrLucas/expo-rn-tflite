import React, { useEffect, useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Button,
  Image,
} from "react-native";
import * as tf from "@tensorflow/tfjs";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";

import * as mobilenet from "@tensorflow-models/mobilenet";
import * as cocossd from "@tensorflow-models/coco-ssd";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import * as jpeg from "jpeg-js";

import * as MediaLibrary from "expo-media-library";

import { Camera } from "expo-camera";
import { StatusBar } from "expo-status-bar";

const App = () => {
  const [isTfReady, setIsTfReady] = useState(false);
  const [result, setResult] = useState("");
  const [pickedImage, setPickedImage] = useState(false);

  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.cancelled) {
      //console.log("result uri", result.uri);
      setPickedImage(result.uri);
    }
  };

  const classifyUsingMobilenet = async (image, base64) => {
    try {
      // Load mobilenet.
      await tf.ready();

      //console.log("image", image);
      const model = await mobilenet.load();

      // const model = await tf.loadLayersModel(
      //   bundleResourceIO(modelJson, modelWeights)
      // );

      setIsTfReady(true);
      //console.log("starting inference with picked image teste: " + pickedImage);

      // Convert image to tensor

      if (base64) {
        const imgBuffer = tf.util.encodeString(image, "base64").buffer;
        const raw = new Uint8Array(imgBuffer);
        const imageTensor = decodeJpeg(raw);
        // Classify the tensor and show the result
        const prediction = await model.classify(imageTensor);

        console.log("prediction", prediction);

        if (prediction && prediction.length > 0) {
          console.log("prediction", prediction);
          setResult(
            `${prediction[0].className} (${prediction[0].probability.toFixed(
              3
            )})`
          );
          setLoading(false);
        }
      } else {
        const imgB64 = await FileSystem.readAsStringAsync(image, {
          encoding: FileSystem.EncodingType.Base64,
        });
        console.log("img64 ===>>", imgB64);
        const imgBuffer = tf.util.encodeString(imgB64, "base64").buffer;
        const raw = new Uint8Array(imgBuffer);
        const imageTensor = decodeJpeg(raw);
        // Classify the tensor and show the result
        const prediction = await model.classify(imageTensor);
        //const prediction = model.predict(image);

        console.log("prediction", prediction);
        if (prediction && prediction.length > 0) {
          console.log("prediction", prediction);

          setResult(
            `${prediction[0].className} (${prediction[0].probability.toFixed(
              3
            )})`
          );
          setLoading(false);
        }
      }
    } catch (err) {
      setLoading(false);

      console.log(err);
    }
  };

  //CAMERA
  let cameraRef = useRef();
  const [hasCameraPermission, setHasCameraPermission] = useState();
  const [hasMediaLibraryPermission, setHasMediaLibraryPermission] = useState();
  const [photo, setPhoto] = useState();

  // const loadModel = async () => {
  //   try {
  //     await tf.ready();
  //     const model = await tf.loadLayersModel(
  //       bundleResourceIO(modelJson, modelWeights)
  //     );

  //     if (model) console.log("model", model);
  //   } catch (err) {
  //     console.log("Erro");
  //   }
  // };

  // useEffect(() => {
  //   loadModel();
  // }, []);

  useEffect(() => {
    if (!!pickedImage) {
      setLoading(true);
      classifyUsingMobilenet(pickedImage, false);
    }
  }, [pickedImage]);

  useEffect(() => {
    if (!!photo) {
      console.log("photo", photo);
      //console.log("photo", photo.base64);
      setLoading(true);
      classifyUsingMobilenet(photo.base64, true);
    }
  }, [photo]);

  useEffect(() => {
    (async () => {
      const cameraPermission = await Camera.requestCameraPermissionsAsync();
      const mediaLibraryPermission =
        await MediaLibrary.requestPermissionsAsync();
      setHasCameraPermission(cameraPermission.status === "granted");
      setHasMediaLibraryPermission(mediaLibraryPermission.status === "granted");
    })();
  }, []);

  if (hasCameraPermission === undefined) {
    return <Text>Requesting permissions...</Text>;
  } else if (!hasCameraPermission) {
    return (
      <Text>
        Permission for camera not granted. Please change this in settings.
      </Text>
    );
  }

  let takePic = async () => {
    let options = {
      quality: 1,
      base64: true,
      exif: false,
    };

    let newPhoto = await cameraRef.current.takePictureAsync(options);

    setPhoto(newPhoto);
  };

  if (photo) {
    // let sharePic = () => {
    //   shareAsync(photo.uri).then(() => {
    //     setPhoto(undefined);
    //   });
    // };

    // let savePhoto = () => {
    //   MediaLibrary.saveToLibraryAsync(photo.uri).then(() => {
    //     setPhoto(undefined);
    //   });
    // };

    return (
      <SafeAreaView style={styles.container}>
        <Image
          style={styles.preview}
          source={{ uri: "data:image/jpg;base64," + photo.base64 }}
        />
        {/* <View style={styles.buttonContainer}>
          <Button title="Take Pic" onPress={takePic} />
        </View> */}
        {loading ? (
          <Text>Carregando...</Text>
        ) : result !== "" ? (
          <Text>{result}</Text>
        ) : (
          <Text>Modelo pronto!</Text>
        )}
        {/* <Button title="Share" onPress={sharePic} />
        {hasMediaLibraryPermission ? (
          <Button title="Save" onPress={savePhoto} />
        ) : undefined}*/}
        <Button title="Voltar" onPress={() => setPhoto(undefined)} />
      </SafeAreaView>
    );
  }

  if (pickedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <Image
          source={{ uri: pickedImage }}
          style={{ width: 200, height: 200, margin: 40 }}
        />
        {/* <View style={styles.buttonContainer}>
          <Button title="Take Pic" onPress={takePic} />
        </View> */}
        {loading ? (
          <Text>Carregando...</Text>
        ) : result !== "" ? (
          <Text>{result}</Text>
        ) : (
          <Text>Modelo pronto!</Text>
        )}
        {/* <Button title="Share" onPress={sharePic} />
        {hasMediaLibraryPermission ? (
          <Button title="Save" onPress={savePhoto} />
        ) : undefined}*/}
        <Button title="Voltar" onPress={() => setPickedImage(undefined)} />
      </SafeAreaView>
    );
  }

  return (
    <Camera style={styles.container} ref={cameraRef}>
      <View
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {!!pickedImage && (
          <>
            <Image
              source={{ uri: pickedImage }}
              style={{ width: 200, height: 200, margin: 40 }}
            />
          </>
        )}

        <View
          style={{
            backgroundColor: "#ffff",
            width: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {loading ? (
            <Text>Carregando...</Text>
          ) : result !== "" ? (
            <Text>{result}</Text>
          ) : (
            <Text>Modelo pronto!</Text>
          )}

          <View
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-around",
              width: "100%",
              paddingBottom: "5%",
            }}
          >
            <Button title="Galeria" onPress={pickImage} />
            <Button title="Tirar Foto" onPress={takePic} />
          </View>
        </View>

        {/* <View style={{ width: "100%", height: 20 }} /> */}
        {/* {!isTfReady && <Text>Loading TFJS model...</Text>} */}
      </View>
    </Camera>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonContainer: {
    backgroundColor: "#fff",
    alignSelf: "flex-end",
  },
  textContainer: {
    background: "#ffff",
  },
  preview: {
    alignSelf: "stretch",
    flex: 1,
  },
});

export default App;
