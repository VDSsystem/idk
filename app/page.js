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

function RootPage() {
  const [model, setModel] = useState(null);
  const [aniId, setAniId] = useState(null);
  const [modelName, setModelName] = useState(null);
  const [loading, setLoading] = useState(0);
  const [warning, setWarning] = useState(false);
  let file;
  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const inputImageRef = useRef(null);

  const [singleImage, setSingleImage] = useBoolean();
  const [liveWebcam, setLiveWebcam] = useBoolean();
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(function(position) {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    });
  }, []);

  useEffect(() => {
    tf.loadGraphModel("https://raw.githubusercontent.com/VDSsystem/yolov5/main/model.json", {
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

      // draw the bounding box
      ctx.strokeStyle = "#C53030";
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, width, height);

      const label = klass + " - " + score + "%";
      const textWidth = ctx.measureText(label).width;
      const textHeight = parseInt(font, 10); // base 10

      // draw the label background
      ctx.fillStyle = "#C53030";
      ctx.fillRect(x1 - 1, y1 - (textHeight + 4), textWidth + 6, textHeight + 4);

      // draw the label text
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(label, x1 + 2, y1 - (textHeight + 2));
    }
  };

  // handler to predict in a single image
  const doPredictImage = async () => {
    setWarning(flase);
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
    console.log("boxes" + boxes + " scores" + scores + " classes" + classes);
    const maxScoreIndex = scoresData.indexOf(Math.max(...scoresData));
  // check if the score is above 0.9 and the class label is 0
  if (scoresData[maxScoreIndex] > 0.9 && classesData[maxScoreIndex] == 0) {
    setWarning(true);
    /*const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', 'myUploads');
    data.append("api_key", '231941467471291');
    let imageUrl;
  try {
    const response = await fetch('https://api.cloudinary.com/v1_1/pdfuuif0cy/image/upload', {
      method: 'POST',
      body: data
    }).then(r => r.json());
    imageUrl = response.url;
    console.log(imageUrl); // log the URL to the console
  } catch (error) {
    console.error(error);
  }
  const response2 = await fetch("https://vadss.vercel.app/api/output", {
    method: 'POST',
    body: JSON.stringify({ url: imageUrl }),
  });
  const data2 = await response2.json();
  console.log(data2.id);*/
    console.log("Accidental Score: " + scoresData[maxScoreIndex] + " class: " + classesData[maxScoreIndex]);
  }


    // build the predictions data
    renderPrediction(boxesData, scoresData, classesData);

    // clear memory
    tf.dispose(res);

    tf.engine().endScope();
  };

  // handler to predict per video frame
  const doPredictFrame = async () => {
    setWarning(flase);
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
    console.log("boxes" + boxes + " scores" + scores + " classes" + classes);
    const maxScoreIndex = scoresData.indexOf(Math.max(...scoresData));
    if (scoresData[maxScoreIndex] > 0.8 && classesData[maxScoreIndex] == 0) {
      setWarning(true);
    }
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
    file = e.target.files[0];

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
        WARNING: A high result accident has been detected and reported to authorities! 
        <Link
        href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
        isExternal={true}
        color="white"
        _hover={{ color: "white", fontWeight: "bold" }}
        >
        View location
        </Link>

        
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
        <Link href="https://vadss.vercel.app/main.html" isExternal={true} color="red.600" _hover={{ color: "red.800", fontWeight: "bold" }} target="_self">
              HOME
       </Link>
          <Text>
            Please select an image or open the camera to determine whether an accident occur or not
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
