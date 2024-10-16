<template>
  <v-container
    class="fill-height align-center justify-center "
    style="background-color: #000000"
  >
    <video
      ref="videoPlayer"
      :controls="true"
      height="50px"
      preload="metadata"
      :src="filePath"
      width="100%"
    />
  </v-container>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'

  export default defineComponent({
    name: 'Player',
    data () {
      return {
        filePath: {} as string,
      }
    },
    mounted () {
      this.filePath = this.$route.query.file as string

      const videoPlayer = this.$refs.videoPlayer as HTMLVideoElement

      const previousProgress = localStorage.getItem(window.location.href)
      if (previousProgress) {
        videoPlayer.currentTime = parseFloat(previousProgress)
      }

      videoPlayer.addEventListener('timeupdate', e => {
        const key = window.location.href
        const value = (e.target as HTMLVideoElement).currentTime
        localStorage.setItem(key, value.toString())
      })
    },
  })
</script>
