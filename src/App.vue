<template>
  <v-app>
    <full-page>
      <div class="section">Introduce</div>
      <div class="section">
        <v-stepper v-model="step">
          <v-stepper-header>
            <v-stepper-step :complete="step > 1" step="1">
              이미지 업로드
            </v-stepper-step>

            <v-divider></v-divider>

            <v-stepper-step :complete="step > 2" step="2">
              이미지 분석
            </v-stepper-step>

            <v-divider></v-divider>

            <v-stepper-step :complete="step > 3" step="3">
              편집
            </v-stepper-step>

            <v-divider></v-divider>
            <v-stepper-step :complete="step > 4" step="4">
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
export default {
  data() {
    return {
      step: 1,
    };
  },
};
</script>
