<template>
  <v-app>
    <full-page ref="fullpage">
      <div class="section">
        Introduce
        <v-btn
          v-show="isModelReady"
          color="primary"
          @click="$refs.fullpage.api.moveSectionDown()"
        >
          시작하기
        </v-btn>
      </div>
      <div class="section">
        <v-stepper v-model="step">
          <v-stepper-header>
            <v-stepper-step :complete="step > 1" step="1">
              이미지 업로드
            </v-stepper-step>

            <v-divider></v-divider>

            <v-stepper-step :complete="step > 2" step="2">
              편집
            </v-stepper-step>

            <v-divider></v-divider>
            <v-stepper-step :complete="step > 3" step="3">
              완성!
            </v-stepper-step>
          </v-stepper-header>

          <v-stepper-items>
            <v-stepper-content step="1">
              <v-file-input
                :rules="rules"
                accept="image/png, image/jpeg, image/bmp"
                placeholder="이미지를 업로드해주세요."
                prepend-icon="mdi-camera"
                label="Image"
                v-model="baseImage"
              ></v-file-input>
              <v-btn
                :disabled="!baseImage"
                color="primary"
                @click="base_processing"
              >
                test
              </v-btn>
            </v-stepper-content>

            <v-stepper-content step="2">
              <div class="workspace">
                <v-slider
                  class="controller-lineHeight"
                  v-model="lineHeight"
                  height="imageHeight"
                  max="100"
                  min="0"
                  vertical
                  @change="draw_line"
                ></v-slider>
                <div class="wrap">
                  <img ref="base" />
                  <canvas ref="canv"></canvas>
                </div>
                <v-slider
                  class="controller-lineHeight"
                  v-model="lineHeight"
                  height="imageHeight"
                  max="100"
                  min="0"
                  vertical
                  @change="draw_line"
                ></v-slider>
              </div>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </div>
      <div class="section">TMI</div>
    </full-page>
  </v-app>
</template>

<script>
import * as tf from "@tensorflow/tfjs";

const MODEL_URL =
  "https://raw.githubusercontent.com/hughesgoon/PicInDepth/main/model/model.json";

export default {
  data() {
    return {
      isModelReady: false,
      model: null,
      step: 1,
      imageHeight: null,
      lineHeight: 50,
      baseImage: null,
      baseImage_depthmap: null,
    };
  },
  methods: {
    loadModel() {
      this.isModelReady = false;
      return tf
        .loadGraphModel(MODEL_URL)
        .then((model) => {
          this.model = model;
          this.isModelReady = true;
          console.log("model loaded: ", model);
        })
        .catch((error) => {
          console.log("failed to load the model", error);
          throw error;
        });
    },
    async base_processing() {
      this.step = 1.5;
      const baseImage_dataURL = await this.Image_to_dataURL(this.baseImage);
      this.setup_workspace(baseImage_dataURL);
      this.generate_depthmap(baseImage_dataURL);
      this.step = 2;
    },
    generate_depthmap(image) {
      return new Promise((resolve) => {
        var im = new Image();

        im.onload = async () => {
          const resized_tensor = this.image_to_tensor(im);
          const depthmap = await this.tensor_to_depthmap(resized_tensor, [
            im.width,
            im.height,
          ]);
          resolve(depthmap);
        };

        im.src = image;
      });
    },
    Image_to_dataURL(image) {
      return new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve(reader.result);
        };

        reader.readAsDataURL(image);
      });
    },
    setup_workspace(baseImage_dataURL) {
      let im = this.$refs.base;
      let canv = this.$refs.canv;

      im.onload = () => {
        canv.width = im.naturalWidth;
        canv.height = im.naturalHeight;

        this.imageHeight =
          im.naturalHeight < im.naturalWidth
            ? "calc((42.25rem - 156px) * " +
              im.naturalHeight +
              " / " +
              im.naturalWidth +
              ")"
            : "70vh";

        document
          .getElementsByClassName("controller-lineHeight")[0]
          .getElementsByClassName("v-input__slot")[0].style.height =
          this.imageHeight;
        document
          .getElementsByClassName("controller-lineHeight")[1]
          .getElementsByClassName("v-input__slot")[0].style.height =
          this.imageHeight;
      };

      im.src = baseImage_dataURL;
    },
    draw_line() {
      var canv = this.$refs.canv;
      var context = canv.getContext("2d");
      context.clearRect(0, 0, canv.width, canv.height);
      context.beginPath();
      context.moveTo(0, (canv.height * (100 - this.lineHeight)) / 100);
      context.lineTo(canv.width, (canv.height * (100 - this.lineHeight)) / 100);
      context.lineWidth = canv.height / 100;
      context.strokeStyle = "white";
      context.stroke();
    },
    image_to_tensor(image) {
      const image_tensor_orig = tf.browser.fromPixels(image);
      const image_tensor_normalized = image_tensor_orig
        .toFloat()
        .div(tf.scalar(255));
      const image_tensor_resized = tf.image.resizeBilinear(
        image_tensor_normalized,
        [224, 224],
        true
      );
      return tf
        .transpose(image_tensor_resized, [2, 0, 1])
        .reshape([1, 3, 224, 224]);
    },
    async tensor_to_depthmap(tensor, [width, height]) {
      const depthmap = await this.model.predict(tensor);
      const depthmap_reshaped = tf
        .transpose(depthmap, [2, 3, 1, 0])
        .reshape([224, 224, 1]);
      const depthmap_resized = tf.image.resizeBilinear(
        depthmap_reshaped,
        [height, width],
        true
      );
      return tf
        .mul(tf.div(depthmap_resized, tf.max(depthmap_resized)), 255)
        .asType("int32");
    },
  },
  mounted() {
    this.$refs.fullpage.api.setAllowScrolling(false);
    this.$refs.fullpage.api.setKeyboardScrolling(false);
    this.loadModel();
  },
};
</script>
