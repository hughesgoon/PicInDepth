<template>
  <div>
    <full-page>
      <div class="section">Introduce</div>
      <div class="section">
        <v-app>
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
          </v-stepper>
        </v-app>
      </div>
      <div class="section">TMI</div>
    </full-page>
  </div>
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
