import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
const Acc_MODEL = [{ name: "yolov5", child: ["best_web_model"] }];
let modelName = Acc_MODEL[0];

async function loadModel() {
  const model = await tf.loadGraphModel(`/model/${modelName.name}/${modelName.child[0]}/model.json`);
  console.log('Model loaded successfully!');
  // Use the model for inference, evaluation, or fine-tuning
}

loadModel().catch(error => {
  console.log('Error loading model: ', error);
});

window.onload = async () => {
  loadModel();
}