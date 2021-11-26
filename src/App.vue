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
              ></v-file-input>
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

const MODEL_URL = "https://raw.githubusercontent.com/hughesgoon/PicInDepth/main/model/model.json";

export default {
  data() {
    return {
      isModelReady: false,
      model: null,
      step: 1,
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
  },
	mounted(){
	this.loadModel();
}
};
</script>
