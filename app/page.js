"use client";

import LABELS from "@app-datasets/coco/classes.json";
import {
  Box,
  Button,
  Center,
  Grid,
  GridItem,
  Link,
  Icon,
  Stack,
  Text,
  VisuallyHiddenInput,
  chakra,
  useBoolean,
} from "@app-providers/chakra-ui";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { useEffect, useRef, useState } from "react";
import { FaTimes } from "react-icons/fa";

const ZOO_MODEL = [{ name: "yolov5", child: ["yolov5n", "yolov5s", "best_web_model"] }];

function RootPage() {
  const [model, setModel] = useState(null);
  const [aniId, setAniId] = useState(null);
  const [modelName, setModelName] = useState(ZOO_MODEL[0]);
  const [loading, setLoading] = useState(0);
  const [warning, setWarning] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [fileRef, setFileRef] = useState(null);
  const [fileRef2, setFileRef2] = useState(null);


  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const inputImageRef = useRef(null);
  const imageURLRef = useRef(null);
  const lngRef = useRef(null);
  const latRef = useRef(null);



  const [singleImage, setSingleImage] = useBoolean();
  const [liveWebcam, setLiveWebcam] = useBoolean();
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(function(position) {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    });
  }, []);

  useEffect(() => {
    tf.loadGraphModel(`/model/${modelName.name}/${modelName.child[2]}/model.json`, {
      onProgress: (fractions) => {
        setLoading(fractions);
      },
    }).then(async (mod) => {
      // warming up the model before using real data
      const dummy = tf.ones(mod.inputs[0].shape);
      const res = await mod.executeAsync(dummy);

      // clear memory
      tf.dispose(res);
      tf.dispose(dummy);

      // save to state
      setModel(mod);
    });
  }, [modelName]);

  // helper for drawing into canvas
  const renderPrediction = (boxesData, scoresData, classesData) => {
    setWarning(false);
    const ctx = canvasRef.current.getContext("2d");

    // clean canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const font = "16px sans-serif";
    ctx.font = font;
    ctx.textBaseline = "top";

    for (let i = 0; i < scoresData.length; ++i) {
      const klass = LABELS[classesData[i]];
      const score = (scoresData[i] * 100).toFixed(1);

      let [x1, y1, x2, y2] = boxesData.slice(i * 4, (i + 1) * 4);
      x1 *= canvasRef.current.width;
      x2 *= canvasRef.current.width;
      y1 *= canvasRef.current.height;
      y2 *= canvasRef.current.height;
      const width = x2 - x1;
      const height = y2 - y1;

      if (classesData[i] == 0) {
        //ctx.fillStyle = "#FF0000"; // red
        // draw the bounding box
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, width, height);
        const label = klass + " - " + score + "%";
        const textWidth = ctx.measureText(label).width;
        const textHeight = parseInt(font, 10); // base 10 
        // draw the label background
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(x1 - 1, y1 - (textHeight + 4), textWidth + 6, textHeight + 4);

        // draw the label text
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label, x1 + 2, y1 - (textHeight + 2));

      } else if (classesData[i] == 1){
        //ctx.fillStyle = "#0000FF"; // blue
         // draw the bounding box
        ctx.strokeStyle = "#0000FF";
        ctx.lineWidth = 2;
        ctx.strokeRect(x1, y1, width, height);
        const label = klass + " - " + score + "%";
        const textWidth = ctx.measureText(label).width;
        const textHeight = parseInt(font, 10); // base 10 
        // draw the label background
        ctx.fillStyle = "#0000FF";
        ctx.fillRect(x1 - 1, y1 - (textHeight + 4), textWidth + 6, textHeight + 4);

        // draw the label text
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(label, x1 + 2, y1 - (textHeight + 2));
      }

      const maxScoreIndex = scoresData.indexOf(Math.max(...scoresData));
  // check if the score is above 0.9 and the class label is 0
  if (scoresData[maxScoreIndex] > 0.8 && classesData[maxScoreIndex] == 0) {
    setWarning(true);
    if (imageRef.current) {
      const im = imageRef.current;
      const c = document.createElement('canvas');
      c.width = im.width;
      c.height = im.width;
      const ctx2 = c.getContext('2d');
      ctx2.drawImage(im, 0, 0, c.width, c.height);
      // create a new File object with the contents of the canvas
      const dataURL = c.toDataURL('image/jpeg', 0.95);
      const byteString = atob(dataURL.split(',')[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      setFileRef(new File([ab], 'image.jpg', { type: 'image/jpeg' }));
    } if (videoRef.current && videoRef.current.srcObject) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        const file = new File([blob], 'screenshot.jpg', { type: 'image/jpeg' });
        setFileRef2(file);
      }, 'image/jpeg', 0.95);
    }
     
  }
  }
  };

  const handleClick = async () => {
    console.log("Button clicked!");
    console.log(location.latitude + " " + location.longitude);
    lngRef.current =  location.longitude
    latRef.current = location.latitude
    let id;
    const data = new FormData();
    if (fileRef) {
      data.append('file', fileRef);
    }
    if (fileRef2){
      data.append('file', fileRef2);

    }
    data.append('upload_preset', 'myUploads');
    data.append("api_key", '231941467471291');
  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/pdfuuif0cy/image/upload', {
      method: 'POST',
      body: data
    }).then(r => r.json());
    imageURLRef.current = response.url;
    console.log(imageURLRef.current); // log the URL to the console
  } catch (error) {
    console.error(error);
  }
  try{
    const currentDate = new Date();

const day = currentDate.getDate();
const month = currentDate.getMonth() + 1; // Months are zero-based, so add 1
const year = currentDate.getFullYear();
const hours = currentDate.getHours();
const minutes = currentDate.getMinutes();
const seconds = currentDate.getSeconds();

const dateString = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    const lat = latRef.current;
    const lng = lngRef.current;
    console.log(lat,lng);
    const url = imageURLRef.current;
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('lat',lat);
    params.append('lng', lng);
    params.append('dateTime', dateString)
    console.log(dateString);
    const response2 = await fetch("https://vadss.vercel.app/api/cameraReports", {
      method: 'POST',
      body: params,
    }).then(r => r.json());
    id = response2.id;
    console.log(id);
  }
  catch(err){
    console.log(err);
  }
  window.alert('Reported, with id: '+ id);
  setWarning(false)
}

  // handler to predict in a single image
  const doPredictImage = async () => {
    if (!model) return;

    tf.engine().startScope();

    // get width and height from model's shape for resizing image
    const [modelWidth, modelHeight] = model.inputs[0].shape.slice(1, 3);

    // pre-processing image
    const input = tf.tidy(() => {
      const imageTensor = tf.browser.fromPixels(imageRef.current);
      return tf.image.resizeBilinear(imageTensor, [modelWidth, modelHeight]).div(255.0).expandDims(0);
    });

    // predicting...
    const res = await model.executeAsync(input);

    const [boxes, scores, classes] = res;
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();

    // build the predictions data
    renderPrediction(boxesData, scoresData, classesData);

    // clear memory
    tf.dispose(res);

    tf.engine().endScope();
  };

  // handler to predict per video frame
  const doPredictFrame = async () => {
    if (!model) return;
    if (!videoRef.current || !videoRef.current.srcObject) return;

    tf.engine().startScope();

    // get width and height from model's shape for resizing image
    const [modelWidth, modelHeight] = model.inputs[0].shape.slice(1, 3);

    // pre-processing frame
    const input = tf.tidy(() => {
      const frameTensor = tf.browser.fromPixels(videoRef.current);
      return tf.image.resizeBilinear(frameTensor, [modelWidth, modelHeight]).div(255.0).expandDims(0);
    });

    // predicting...
    const res = await model.executeAsync(input);

    const [boxes, scores, classes] = res;
    const boxesData = boxes.dataSync();
    const scoresData = scores.dataSync();
    const classesData = classes.dataSync();

    // build the predictions data
    renderPrediction(boxesData, scoresData, classesData);

    // clear memory
    tf.dispose(res);

    const reqId = requestAnimationFrame(doPredictFrame);
    setAniId(reqId);

    tf.engine().endScope();
  };
  // handler while uploading single image
  const imageHandler = (e) => {
    const file = e.target.files[0];

    if (file === null || file === undefined) {
      return;
    }

    const src = window.URL.createObjectURL(file);
    imageRef.current.src = src;
    setSingleImage.toggle();

    imageRef.current.onload = () => {
      doPredictImage();
      window.URL.revokeObjectURL(src);
    };
  };

  // handler while activating webcam
  const webcamHandler = async () => {
    if (!navigator.mediaDevices) return;
    if (!navigator.mediaDevices.getUserMedia) return;

    const media = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "environment",
      },
    });

    window.localStream = media;
    videoRef.current.srcObject = media;
    setLiveWebcam.toggle();
    videoRef.current.onloadedmetadata = () => {
      doPredictFrame();
    };
  };

  return (
    <>
    {warning && (
      <Box
        position="absolute"
        bottom={4}
        left={4}
        right={4}
        p={4}
        bgColor="red.600"
        color="white"
        fontSize="xl"
        fontWeight="bold"
        textAlign="center"
      >
        WARNING: A high result accident has been detected!
        
        <Button onClick={handleClick} color="red">
          Report 
        </Button> 

      </Box>
    )}
    {!warning && <></>}
      {/* loading layer  */}
      <Center
        width="full"
        height="full"
        display={model ? "none" : "flex"}
        color="white"
        bgColor="blackAlpha.800"
        position="absolute"
        top={0}
        left={0}
        zIndex={999}
        cursor="progress"
      >
        {`Loading model... ${(loading * 100).toFixed(1)}%`}
      </Center>

      {/* main layer */}
      <Center as="section" flexDir="column" minH={{ base: "calc(100vh - 60px)", md: "calc(100vh - 100px)" }}>
        <Stack align="center" textAlign="center" spacing={4} mb={10} maxW={640}>
        <Link href="https://vadss.vercel.app/view/main.html" isExternal={true} color="red.600" _hover={{ color: "red.800", fontWeight: "bold" }} target="_self">
              HOME
       </Link>
          <Text>
            Please open the location for the website to report accidents with high results,
            you can report by uploading an image or opening the webcam
          </Text>
        </Stack>

        <Stack align="center" textAlign="center" spacing={0} mb={10} width="full" maxWidth={640}>
          <UploadLayer display={!singleImage && !liveWebcam ? "flex" : "none"} />
          <Box
            id="image-placeholder"
            width="full"
            position="relative"
            bgImage={`url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='none' stroke='%23E4E6ED' stroke-width='4' stroke-dasharray='4, 12' stroke-linecap='square'/%3E%3C/svg%3E")`}
            display={singleImage || liveWebcam ? "flex" : "none"}
          >
            <chakra.img
              ref={imageRef}
              src="#"
              width="full"
              alt="Image Placeholder"
              display={singleImage && !liveWebcam ? "block" : "none"}
            />
            <chakra.video
              ref={videoRef}
              width="full"
              autoPlay
              playsInline
              muted
              display={liveWebcam && !singleImage ? "block" : "none"}
            />
            <canvas ref={canvasRef} width={640} height={640} />
            {/* <Box id="prediction-placeholder" /> */}
            <Icon
              as={FaTimes}
              color="white"
              bgColor="red.600"
              boxSize={6}
              position="absolute"
              zIndex={1}
              top={0}
              right={0}
              cursor="pointer"
              display={singleImage || liveWebcam ? "block" : "none"}
              onClick={() => {
                if (singleImage) {
                  imageRef.current.src = "#";
                  inputImageRef.current.value = "";
                  setSingleImage.toggle();
                }
                if (liveWebcam && videoRef.current.srcObject) {
                  cancelAnimationFrame(aniId);
                  setAniId(null);
                  videoRef.current.srcObject = null;
                  window.localStream.getTracks().forEach((track) => {
                    track.stop();
                  });
                  setLiveWebcam.toggle();
                }
                // clear earlier detections data
                // document.getElementById("prediction-placeholder").replaceChildren();
              }}
              aria-hidden="true"
            />
          </Box>
        </Stack>

        <VisuallyHiddenInput ref={inputImageRef} type="file" accept="image/*" onChange={imageHandler} />

        <Grid
          gap={2}
          templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(2, 1fr)" }}
          templateRows={{ base: "repeat(2, 1fr)", md: "repeat(1, 1fr)" }}
        >
          <GridItem as={Button} disabled={singleImage || liveWebcam} onClick={() => inputImageRef.current.click()}>
            Single Image
          </GridItem>
          <GridItem as={Button} disabled={liveWebcam || singleImage} onClick={webcamHandler}>
            Live Webcam
          </GridItem>
        </Grid>
      </Center>
    </>
  );
}

function UploadLayer({ ...restProps }) {
  return (
    <Center
      width="full"
      height={320}
      bgImage={`url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='none' stroke='%23E4E6ED' stroke-width='4' stroke-dasharray='4, 12' stroke-linecap='square'/%3E%3C/svg%3E")`}
      {...restProps}
    >
      <Icon focusable="false" viewBox="0 0 512 512" boxSize={128} fill="gray.200" aria-hidden="true">
        <path d="M464 64H48C21.49 64 0 85.49 0 112v288c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V112c0-26.51-21.49-48-48-48zm-6 336H54a6 6 0 0 1-6-6V118a6 6 0 0 1 6-6h404a6 6 0 0 1 6 6v276a6 6 0 0 1-6 6zM128 152c-22.091 0-40 17.909-40 40s17.909 40 40 40 40-17.909 40-40-17.909-40-40-40zM96 352h320v-80l-87.515-87.515c-4.686-4.686-12.284-4.686-16.971 0L192 304l-39.515-39.515c-4.686-4.686-12.284-4.686-16.971 0L96 304v48z"></path>
      </Icon>
    </Center>
  );
}

export default RootPage;
