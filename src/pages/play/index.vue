<template>
  <v-container
    class="fill-height align-center justify-center"
  >
    <v-container>
      <v-row class="align-center justify-center">
        <v-chip
          color="green"
          prepend-icon="mdi-headphones"
          size="small"
          variant="tonal"
        >
          同時收聽 {{ listenerCount }} 人
        </v-chip>
      </v-row>
      <v-row class="align-center justify-center mt-6">
        <div class="text-h4 text-center">{{ $route.query.msgTitle }}</div>
      </v-row>
      <v-row class="align-center justify-center mt-16">
        <div class="text-h6 text-center">{{ $route.query.fileTitle }}</div>
      </v-row>
      <v-row class="mt-10">
        <video
          ref="videoPlayer"
          :controls="true"
          height="50px"
          preload="metadata"
          :src="filePath"
          width="100%"
        />
      </v-row>
      <v-row class="mt-10 align-center justify-center">
        <v-btn-group
          divided
          variant="outlined"
        >
          <v-btn icon="mdi-rewind-10" @click="() => move(-10)" />
          <v-btn icon="mdi-rewind-5" @click="() => move(-5)" />
          <v-btn icon="mdi-fast-forward-5" @click="() => move(5)" />
          <v-btn icon="mdi-fast-forward-10" @click="() => move(10)" />
        </v-btn-group>
      </v-row>
    </v-container>
  </v-container>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'
  import { usePresence } from '@/composables/usePresence'

  export default defineComponent({
    name: 'Player',
    setup () {
      // On the playback page this client counts as an active listener.
      const { listenerCount } = usePresence({ register: true })
      return { listenerCount }
    },
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
    methods: {
      move (time: number) {
        const videoPlayer = this.$refs.videoPlayer as HTMLVideoElement
        videoPlayer.currentTime += time
      },
    },
  })
</script>
