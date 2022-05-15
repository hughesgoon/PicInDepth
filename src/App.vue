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
              <v-overlay :absolute="absolute" :value="overlay">
                <h2>잠시만 기다려주세요</h2>
              </v-overlay>
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
              <div class="controller-wrap">
                <input
                  id="color"
                  type="color"
                  v-model="lineColor"
                  @input="draw_line"
                />
                <div class="sliders">
                  <v-slider
                    :disabled="isMaskGeneratorWorking"
                    v-model="lineDepth"
                    hint="값이 작을수록 선이 위로 와요!"
                    persistent-hint
                    max="255"
                    min="0"
                    label="깊이감"
                    @change="generate_depth_mask"
                  ></v-slider>
                  <v-slider
                    v-model="lineWidth"
                    max="10"
                    min="1"
                    label="두께"
                    @change="draw_line"
                  ></v-slider>
                </div>
              </div>
              <nav>
                <v-btn color="primary" @click="step = 1"> 사진 바꾸기 </v-btn>
                <v-btn color="primary" @click="generate_photo"> 완성! </v-btn>
              </nav>
            </v-stepper-content>
            <v-stepper-content step="3">
              <div class="showroom">
                <canvas ref="res"></canvas>
              </div>
              <nav>
                <v-btn color="primary" @click="step = 1"> 사진 바꾸기 </v-btn>
                <v-btn color="primary" @click="step = 2">
                  편집기로 돌아가기
                </v-btn>
              </nav>
            </v-stepper-content>
          </v-stepper-items>
        </v-stepper>
      </div>
      <div class="section">TMI</div>
    </full-page>
  </v-app>
</template>

<style lang="scss">
@import "./assets/index.scss";
</style>

<script>
import * as tf from "@tensorflow/tfjs";

const MODEL_URL =
  "https://raw.githubusercontent.com/hughesgoon/PicInDepth/main/model/model.json";

export default {
  data() {
    return {
      isModelReady: false,
      isMaskGeneratorWorking: false,
      model: null,
      step: 1,
      imageHeight: null,
      absolute: true,
      overlay: false,
      lineColor: "#FFFFFF",
      lineWidth: 1,
      lineHeight: 50,
      lineDepth: 128,
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
      this.overlay = true;
      const baseImage_dataURL = await this.Image_to_dataURL(this.baseImage);
      this.setup_workspace(baseImage_dataURL);
      this.generate_depthmap(baseImage_dataURL)
        .then((depthmap) => {
          this.baseImage_depthmap = depthmap;
        })
        .then(() => {
          this.generate_depth_mask();
        })
        .then(() => {
          this.draw_line();
          this.overlay = false;
          this.step = 2;
        });
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
          "min(calc((min(100vw, 42.25rem) - 98px) * " +
          im.naturalHeight +
          " / " +
          im.naturalWidth +
          "), 50vh)";

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
    apply_mask_to_line() {
      return new Promise((resolve) => {
        let im = new Image();
        let canv = this.$refs.canv;
        const ctx = canv.getContext("2d");

        im.onload = () => {
          ctx.globalCompositeOperation = "destination-in";
          ctx.drawImage(im, 0, 0);
          resolve();
        };

        im.src = canv.style.webkitMaskImage.slice(5, -2);
      });
    },
    draw_line() {
      var canv = this.$refs.canv;
      var context = canv.getContext("2d");
      context.clearRect(0, 0, canv.width, canv.height);
      context.beginPath();
      context.moveTo(0, (canv.height * (100 - this.lineHeight)) / 100);
      context.lineTo(canv.width, (canv.height * (100 - this.lineHeight)) / 100);
      context.lineWidth = (canv.height * this.lineWidth) / 100;
      context.strokeStyle = this.lineColor;
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
    generate_depth_mask() {
      const canv = this.$refs.canv;
      const tmp = document.createElement("canvas");

      const depthmap = this.baseImage_depthmap;
      const depthmap_shape = depthmap.shape;
      const depth_level = this.lineDepth;
      var depth_mask = tf.ones([depthmap_shape[0], depthmap_shape[1], 3]);
      this.isMaskGeneratorWorking = true;
      if (depth_level == 0) {
        depth_mask = depth_mask
          .concat(
            tf.ones([depthmap_shape[0], depthmap_shape[1], 1]).mul(255),
            -1
          )
          .asType("int32");
      } else if (depth_level == 255) {
        depth_mask = depth_mask
          .concat(tf.zeros([depthmap_shape[0], depthmap_shape[1], 1]), -1)
          .asType("int32");
      } else {
        depth_mask = depth_mask
          .concat(depthmap.floorDiv(depth_level).minimum(1).mul(255), -1)
          .asType("int32");
      }
      depth_mask.dataSync();
      tf.browser.toPixels(depth_mask, tmp).then(() => {
        depth_mask.dispose();
        var dataURL = tmp.toDataURL();
        canv.style.webkitMaskImage = "url(" + dataURL + ")";
        this.isMaskGeneratorWorking = false;
      });
    },
    generate_photo() {
      const baseImage = this.$refs.base;
      const line = this.$refs.canv;
      const space =
        Math.min(baseImage.naturalWidth, baseImage.naturalHeight) / 10;
      var canv = this.$refs.res;
      canv.width = baseImage.naturalWidth + 2 * space;
      canv.height = baseImage.naturalHeight + 5 * space;

      var ctx = canv.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canv.width, canv.height);

      this.apply_mask_to_line().then(() => {
        ctx.drawImage(baseImage, space, space);
        ctx.drawImage(line, space, space);
        this.step = 3;
      });
    },
  },
  mounted() {
    this.$refs.fullpage.api.setAllowScrolling(false);
    this.$refs.fullpage.api.setKeyboardScrolling(false);
    this.loadModel();
  },
};
</script>
